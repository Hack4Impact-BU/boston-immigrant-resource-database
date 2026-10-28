"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isSessionExistsError } from "@/features/auth/auth-helpers";

import { AFTER_SIGN_IN_PATH, setLoginFormBusy } from "../after-sign-in";

// How long the form stays busy once someone is on their way to the next page, in case that page never opens.
const FORM_RELEASE_DELAY_MS = 15_000;

const SIGN_IN_ERROR_MESSAGES = {
	loading: "Sign in is still loading. Please try again in a moment.",
	missingSession: "We could not finish signing you in. Please try again.",
	missingPasswordResetRequest: "Please request a password reset code before continuing.",
	missingVerificationRequest: "Please request a verification code before continuing.",
	passwordResetIncomplete: "We could not reset your password. Please check the code and try again.",
	unsupportedSignInStep:
		"This sign-in needs another verification step that is not available on this page yet. Please contact support.",
	unsupportedPasswordReset:
		"Password reset is not available for this account. Please contact support.",
	unsupportedVerification:
		"We need to verify this sign-in, but this account does not have a supported verification method. Please contact support.",
	verificationIncomplete: "We could not verify that code. Please check it and try again.",
};

export type SignInWithPasswordInput = {
	identifier: string;
	password: string;
};

export type ResetPasswordInput = {
	password: string;
};

type PasswordResetFactor = {
	emailAddressId: string;
	safeIdentifier?: string;
	strategy: "reset_password_email_code";
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

function getPasswordResetEmailCodeFactor(factors: unknown): PasswordResetFactor | undefined {
	if (!Array.isArray(factors)) {
		return;
	}

	for (const factor of factors) {
		if (!factor || typeof factor !== "object") {
			continue;
		}

		const candidate = factor as {
			emailAddressId?: unknown;
			safeIdentifier?: unknown;
			strategy?: unknown;
		};

		if (
			candidate.strategy === "reset_password_email_code" &&
			typeof candidate.emailAddressId === "string"
		) {
			return {
				emailAddressId: candidate.emailAddressId,
				safeIdentifier:
					typeof candidate.safeIdentifier === "string" ? candidate.safeIdentifier : undefined,
				strategy: "reset_password_email_code",
			};
		}
	}
}

function isCompleteSignIn(status: string | null) {
	return status === "complete";
}

export function useClerkSignIn() {
	const router = useRouter();
	const { isLoaded, setActive, signIn } = useSignIn();
	const [isPasswordResetCodeVerified, setIsPasswordResetCodeVerified] = useState(false);
	const [passwordResetFactor, setPasswordResetFactor] = useState<PasswordResetFactor>();
	const [verificationFactor, setVerificationFactor] = useState<VerificationFactor>();
	const [isSigningIn, setIsSigningIn] = useState(false);
	const isSigningInRef = useRef(false);
	const isLeavingRef = useRef(false);
	const releaseTimerRef = useRef<number | undefined>(undefined);

	useEffect(
		() => () => {
			window.clearTimeout(releaseTimerRef.current);
			setLoginFormBusy(false);
		},
		[],
	);

	function getLoadedClerk() {
		if (!isLoaded || !setActive || !signIn) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.loading);
		}

		return { setActive, signIn };
	}

	function beginSigningInAction() {
		if (isSigningInRef.current) {
			return false;
		}

		isSigningInRef.current = true;
		setIsSigningIn(true);
		setLoginFormBusy(true);

		return true;
	}

	function endSigningInAction() {
		// Once someone is on their way to the next page the form stays busy. The page takes a moment to open (the middleware looks up
		// their access first), and pressing Sign In again in that moment only gets "You're already signed in." from Clerk.
		if (isLeavingRef.current) {
			return;
		}

		isSigningInRef.current = false;
		setIsSigningIn(false);
		setLoginFormBusy(false);
	}

	// Sends a signed-in person on to the next page, and keeps the form busy until it opens.
	function goToAfterSignInPage() {
		isLeavingRef.current = true;
		isSigningInRef.current = true;
		setIsSigningIn(true);
		setLoginFormBusy(true);

		window.clearTimeout(releaseTimerRef.current);
		releaseTimerRef.current = window.setTimeout(() => {
			isLeavingRef.current = false;
			endSigningInAction();
		}, FORM_RELEASE_DELAY_MS);

		router.replace(AFTER_SIGN_IN_PATH);
		router.refresh();
	}

	// Clerk refuses to sign anyone in when this browser already has a signed-in session, and says "You're already signed in.". That
	// happens when the sign-in page was left open (or came back with the Back button) after signing in, in this tab or another one, or
	// when Sign In is pressed again while the next page is still opening. The person is signed in, so what they need is the next page
	// and not that message.
	async function forwardIfAlreadySignedIn<T>(action: () => Promise<T>) {
		try {
			return await action();
		} catch (error) {
			if (!isSessionExistsError(error)) {
				throw error;
			}

			goToAfterSignInPage();
		}
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
		goToAfterSignInPage();
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

		if (!beginSigningInAction()) {
			return;
		}

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
			endSigningInAction();
		}
	}

	async function requestPasswordResetCode(identifier: string) {
		const { signIn } = getLoadedClerk();

		if (!beginSigningInAction()) {
			return;
		}

		try {
			const signInAttempt = await signIn.create({ identifier });
			const resetFactor = getPasswordResetEmailCodeFactor(signInAttempt.supportedFirstFactors);

			if (!resetFactor) {
				throw new Error(SIGN_IN_ERROR_MESSAGES.unsupportedPasswordReset);
			}

			await signInAttempt.prepareFirstFactor({
				emailAddressId: resetFactor.emailAddressId,
				strategy: resetFactor.strategy,
			});

			setIsPasswordResetCodeVerified(false);
			setPasswordResetFactor(resetFactor);
			setVerificationFactor(undefined);
		} finally {
			endSigningInAction();
		}
	}

	async function verifyPasswordResetCode(code: string) {
		const { signIn } = getLoadedClerk();

		if (!passwordResetFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingPasswordResetRequest);
		}

		if (!beginSigningInAction()) {
			return;
		}

		try {
			const signInAttempt = await signIn.attemptFirstFactor({
				code,
				strategy: passwordResetFactor.strategy,
			});

			if (signInAttempt.status !== "needs_new_password") {
				throw new Error(SIGN_IN_ERROR_MESSAGES.passwordResetIncomplete);
			}

			setIsPasswordResetCodeVerified(true);
		} finally {
			endSigningInAction();
		}
	}

	async function resetPassword(input: ResetPasswordInput) {
		const { signIn } = getLoadedClerk();

		if (!passwordResetFactor || !isPasswordResetCodeVerified) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingPasswordResetRequest);
		}

		if (!beginSigningInAction()) {
			return;
		}

		try {
			const resetAttempt = await signIn.resetPassword({
				password: input.password,
				signOutOfOtherSessions: true,
			});

			if (isCompleteSignIn(resetAttempt.status)) {
				await activateSession(resetAttempt.createdSessionId);
				return;
			}

			if (resetAttempt.status === "needs_second_factor") {
				await startVerificationStep(resetAttempt.supportedSecondFactors);
				return;
			}

			throw new Error(SIGN_IN_ERROR_MESSAGES.unsupportedSignInStep);
		} finally {
			endSigningInAction();
		}
	}

	async function resendPasswordResetCode() {
		const { signIn } = getLoadedClerk();

		if (!passwordResetFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingPasswordResetRequest);
		}

		if (!beginSigningInAction()) {
			return;
		}

		try {
			await signIn.prepareFirstFactor({
				emailAddressId: passwordResetFactor.emailAddressId,
				strategy: passwordResetFactor.strategy,
			});
		} finally {
			endSigningInAction();
		}
	}

	async function verifyClientTrustCode(code: string) {
		const { signIn } = getLoadedClerk();

		if (!verificationFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingVerificationRequest);
		}

		if (!beginSigningInAction()) {
			return;
		}

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
			endSigningInAction();
		}
	}

	async function resendClientTrustCode() {
		if (!verificationFactor) {
			throw new Error(SIGN_IN_ERROR_MESSAGES.missingVerificationRequest);
		}

		if (!beginSigningInAction()) {
			return;
		}

		try {
			await sendVerificationCode(verificationFactor);
		} finally {
			endSigningInAction();
		}
	}

	function restartSignIn() {
		setIsPasswordResetCodeVerified(false);
		setVerificationFactor(undefined);
		setPasswordResetFactor(undefined);
	}

	return {
		clientTrustFactor: verificationFactor,
		isPasswordResetCodeVerified,
		isSigningIn,
		passwordResetFactor,
		requestPasswordResetCode: (identifier: string) => forwardIfAlreadySignedIn(() => requestPasswordResetCode(identifier)),
		resendClientTrustCode: () => forwardIfAlreadySignedIn(resendClientTrustCode),
		resendPasswordResetCode: () => forwardIfAlreadySignedIn(resendPasswordResetCode),
		resetPassword: (input: ResetPasswordInput) => forwardIfAlreadySignedIn(() => resetPassword(input)),
		restartSignIn,
		signInWithPassword: (input: SignInWithPasswordInput) => forwardIfAlreadySignedIn(() => signInWithPassword(input)),
		verifyPasswordResetCode: (code: string) => forwardIfAlreadySignedIn(() => verifyPasswordResetCode(code)),
		verifyClientTrustCode: (code: string) => forwardIfAlreadySignedIn(() => verifyClientTrustCode(code)),
	};
}
