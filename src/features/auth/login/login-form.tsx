"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";

import { useClerkSignIn } from "./use-clerk-sign-in";

export function LoginForm() {
  const {
    clientTrustFactor,
    isSigningIn,
    resendClientTrustCode,
    restartSignIn,
    signInWithPassword,
    verifyClientTrustCode,
  } = useClerkSignIn();
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await signInWithPassword({
        identifier: getRequiredFormString(formData, "identifier"),
        password: getRequiredFormString(formData, "password"),
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Sign in could not be completed."));
    }
  }

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await verifyClientTrustCode(getRequiredFormString(formData, "code"));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Verification could not be completed."));
    }
  }

  async function handleResendCode() {
    setErrorMessage(undefined);

    try {
      await resendClientTrustCode();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Verification code could not be resent."));
    }
  }

  if (clientTrustFactor) {
    return (
      <form onSubmit={handleVerificationSubmit} className="space-y-5">
        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Enter the verification code sent to {clientTrustFactor.safeIdentifier ?? "your account"}.
        </p>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium text-slate-700">
            Verification Code
          </Label>
          <Input
            key="client-trust-code"
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter your code"
            required
            className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
          />
        </div>

        <Button
          type="submit"
          disabled={isSigningIn}
          className="h-12 w-full rounded-lg bg-[#5d93c7] text-base font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]"
        >
          {isSigningIn ? "Verifying..." : "Verify"}
        </Button>

        <div className="flex items-center justify-between gap-4 text-sm">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isSigningIn}
            className="font-medium text-[#5d93c7] transition-colors hover:text-[#4b81b6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={restartSignIn}
            disabled={isSigningIn}
            className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Use a different account
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-sm font-medium text-slate-700">
          Username or Email
        </Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Your username or email"
          required
          className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your Password"
          required
          className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
        />
      </div>

      <Button
        type="submit"
        disabled={isSigningIn}
        className="h-12 w-full rounded-lg bg-[#5d93c7] text-base font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]"
      >
        {isSigningIn ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
