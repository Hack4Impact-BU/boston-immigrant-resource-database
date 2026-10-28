"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { AFTER_SIGN_IN_PATH } from "@/features/auth/after-sign-in";
import { isSessionExistsError, throwIfClerkError } from "@/features/auth/auth-helpers";

export type RegisterClerkValues = {
  email: string;
  password: string;
};

function getSignUpState(signUp: ReturnType<typeof useSignUp>["signUp"]) {
  return {
    status: signUp.status,
    clerkUserId: signUp.createdUserId,
    sessionId: signUp.createdSessionId,
    needsEmailVerification: signUp.unverifiedFields.includes("email_address"),
  };
}

export function useClerkSignUp() {
  const router = useRouter();
  const { errors, fetchStatus, signUp } = useSignUp();

  // Registering while this browser already has a signed-in session fails with "You're already signed in.". Someone who is signed in
  // has no use for the register form, so they are sent on to /map (the middleware sends an account that is still waiting for access
  // on to /access-status), and the action then never finishes: the form stays busy while the next page opens, instead of carrying on
  // with the rest of registering (or, worse, treating the error as a failed registration and signing the person out).
  async function forwardIfAlreadySignedIn<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (!isSessionExistsError(error)) {
        throw error;
      }

      router.replace(AFTER_SIGN_IN_PATH);
      router.refresh();

      return new Promise<T>(() => {});
    }
  }

  async function createClerkSignUp(values: RegisterClerkValues) {
    const result = await signUp.create({
      emailAddress: values.email,
      password: values.password,
    });

    throwIfClerkError(result);

    if (signUp.unverifiedFields.includes("email_address")) {
      await sendEmailVerificationCode();
    }

    return getSignUpState(signUp);
  }

  async function sendEmailVerificationCode() {
    const result = await signUp.verifications.sendEmailCode();

    throwIfClerkError(result);

    return getSignUpState(signUp);
  }

  async function verifyEmailCode(code: string) {
    const result = await signUp.verifications.verifyEmailCode({ code });

    throwIfClerkError(result);

    return getSignUpState(signUp);
  }

  async function activateClerkSession() {
    const result = await signUp.finalize();

    throwIfClerkError(result);

    return getSignUpState(signUp);
  }

  return {
    activateClerkSession: () => forwardIfAlreadySignedIn(activateClerkSession),
    createClerkSignUp: (values: RegisterClerkValues) => forwardIfAlreadySignedIn(() => createClerkSignUp(values)),
    errors,
    isSubmitting: fetchStatus === "fetching",
    sendEmailVerificationCode: () => forwardIfAlreadySignedIn(sendEmailVerificationCode),
    signUpStatus: signUp.status,
    verifyEmailCode: (code: string) => forwardIfAlreadySignedIn(() => verifyEmailCode(code)),
  };
}
