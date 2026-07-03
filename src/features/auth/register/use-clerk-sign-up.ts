"use client";

import { useSignUp } from "@clerk/nextjs";

import { throwIfClerkError } from "@/features/auth/auth-helpers";

export type RegisterClerkValues = {
  email: string;
  username: string;
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
  const { errors, fetchStatus, signUp } = useSignUp();

  async function createClerkSignUp(values: RegisterClerkValues) {
    const result = await signUp.create({
      emailAddress: values.email,
      username: values.username,
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
    activateClerkSession,
    createClerkSignUp,
    errors,
    isSubmitting: fetchStatus === "fetching",
    sendEmailVerificationCode,
    signUpStatus: signUp.status,
    verifyEmailCode,
  };
}
