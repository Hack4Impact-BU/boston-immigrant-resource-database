"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AFTER_SIGN_IN_PATH = "/contact";

const SIGN_IN_ERROR_MESSAGES = {
	loading: "Sign in is still loading. Please try again in a moment.",
	missingSession: "We could not finish signing you in. Please try again.",
	missingVerificationRequest: "Please request a verification code before continuing.",
	unsupportedSignInStep:
		"This sign-in needs another verification step that is not available on this page yet. Please contact support.",
	unsupportedVerification:
		"We need to verify this sign-in, but this account does not have a supported verification method. Please contact support.",
	verificationIncomplete: "We could not verify that code. Please check it and try again.",
};

export type SignInWithPasswordInput = {
	identifier: string;
	password: string;
};

type EmailCodeVerificationFactor = {
	emailAddressId: string;
	safeIdentifier?: string;
	strategy: "email_code";
};

type PhoneCodeVerificationFactor = {
	phoneNumberId: string;
	safeIdentifier?: string;
	strategy: "phone_code";
};

type VerificationFactor = EmailCodeVerificationFactor | PhoneCodeVerificationFactor;

type AvailableSecondFactor = {
	emailAddressId?: string;
	phoneNumberId?: string;
	safeIdentifier?: string;
	strategy: string;
};

function isEmailCodeFactor(factor: AvailableSecondFactor): factor is EmailCodeVerificationFactor {
	return factor.strategy === "email_code" && typeof factor.emailAddressId === "string";
}

function isPhoneCodeFactor(factor: AvailableSecondFactor): factor is PhoneCodeVerificationFactor {
	return factor.strategy === "phone_code" && typeof factor.phoneNumberId === "string";
}

function getVerificationFactor(factors: AvailableSecondFactor[] | null | undefined) {
	return factors?.find(isEmailCodeFactor) ?? factors?.find(isPhoneCodeFactor);
}

function isCompleteSignIn(status: string | null) {
	return status === "complete";
}

export function useClerkSignIn() {
	const router = useRouter();
	const { isLoaded, setActive, signIn } = useSignIn();
	const [verificationFactor, setVerificationFactor] = useState<VerificationFactor>();
	const [isSigningIn, setIsSigningIn] = useState(false);

	function getLoadedClerk() {
		if (!isLoaded || !setActive || !signIn) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.loading);
		}

		return { setActive, signIn };
	}

	async function sendVerificationCode(factor: VerificationFactor) {
		const { signIn } = getLoadedClerk();

		if (factor.strategy === "email_code") {
			await signIn.prepareSecondFactor({
				emailAddressId: factor.emailAddressId,
				strategy: factor.strategy,
			});
			return;
		}

		await signIn.prepareSecondFactor({
			phoneNumberId: factor.phoneNumberId,
			strategy: factor.strategy,
		});
	}

	async function activateSession(sessionId: string | null) {
		const { setActive } = getLoadedClerk();

		if (!sessionId) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingSession);
		}

		await setActive({ session: sessionId });
		router.push(AFTER_SIGN_IN_PATH);
		router.refresh();
	}

	async function startVerificationStep(factors: AvailableSecondFactor[] | null | undefined) {
		const factor = getVerificationFactor(factors);

		if (!factor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.unsupportedVerification);
		}

		await sendVerificationCode(factor);
		setVerificationFactor(factor);
	}

	async function signInWithPassword(input: SignInWithPasswordInput) {
		const { signIn } = getLoadedClerk();

		setIsSigningIn(true);

		try {
			const signInAttempt = await signIn.create({
				identifier: input.identifier,
				password: input.password,
				strategy: "password",
			});

			if (isCompleteSignIn(signInAttempt.status)) {
				await activateSession(signInAttempt.createdSessionId);
				return;
			}

			if (signInAttempt.status === "needs_client_trust") {
				await startVerificationStep(signInAttempt.supportedSecondFactors);
				return;
			}

			throw new Error(SIGN_IN_ERROR_MESSAGES.unsupportedSignInStep);
		} finally {
			setIsSigningIn(false);
		}
	}

	async function verifyClientTrustCode(code: string) {
		const { signIn } = getLoadedClerk();

		if (!verificationFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingVerificationRequest);
		}

		setIsSigningIn(true);

		try {
			const signInAttempt = await signIn.attemptSecondFactor({
				code,
				strategy: verificationFactor.strategy,
			});

			if (isCompleteSignIn(signInAttempt.status)) {
				await activateSession(signInAttempt.createdSessionId);
				return;
			}

			throw new Error(SIGN_IN_ERROR_MESSAGES.verificationIncomplete);
		} finally {
			setIsSigningIn(false);
		}
	}

	async function resendClientTrustCode() {
		if (!verificationFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingVerificationRequest);
		}

		setIsSigningIn(true);

		try {
			await sendVerificationCode(verificationFactor);
		} finally {
			setIsSigningIn(false);
		}
	}

	function restartSignIn() {
		setVerificationFactor(undefined);
	}

	return {
		clientTrustFactor: verificationFactor,
		isSigningIn,
		resendClientTrustCode,
		restartSignIn,
		signInWithPassword,
		verifyClientTrustCode,
	};
}
