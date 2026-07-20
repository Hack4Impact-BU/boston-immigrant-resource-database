"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRequiredFormString } from "@/features/auth/auth-helpers";

import { getSignInErrorMessage } from "./get-sign-in-error-message";
import { useClerkSignIn } from "./use-clerk-sign-in";

export function LoginForm() {
  const {
    clientTrustFactor,
    isPasswordResetCodeVerified,
    isSigningIn,
    passwordResetFactor,
    requestPasswordResetCode,
    resendClientTrustCode,
    resendPasswordResetCode,
    resetPassword,
    restartSignIn,
    signInWithPassword,
    verifyPasswordResetCode,
    verifyClientTrustCode,
  } = useClerkSignIn();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);

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
      setErrorMessage(getSignInErrorMessage(error, "Sign in could not be completed."));
    }
  }

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await verifyClientTrustCode(getRequiredFormString(formData, "code"));
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Verification could not be completed."));
    }
  }

  async function handleResendCode() {
    setErrorMessage(undefined);

    try {
      await resendClientTrustCode();
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Verification code could not be resent."));
    }
  }

  async function handlePasswordResetRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await requestPasswordResetCode(getRequiredFormString(formData, "identifier"));
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Password reset could not be started."));
    }
  }

  async function handlePasswordResetCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await verifyPasswordResetCode(getRequiredFormString(formData, "code"));
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Reset code could not be verified."));
    }
  }

  async function handleNewPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const password = getRequiredFormString(formData, "password");
    const confirmPassword = getRequiredFormString(formData, "confirmPassword");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await resetPassword({
        password,
      });
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Password could not be reset."));
    }
  }

  async function handleResendPasswordResetCode() {
    setErrorMessage(undefined);

    try {
      await resendPasswordResetCode();
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error, "Password reset code could not be resent."));
    }
  }

  function handleBackToSignIn() {
    setErrorMessage(undefined);
    setIsPasswordResetMode(false);
    restartSignIn();
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

  if (passwordResetFactor) {
    if (isPasswordResetCodeVerified) {
      return (
        <form onSubmit={handleNewPasswordSubmit} className="space-y-5">
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}

          <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Code verified. Choose a new password for your account.
          </p>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium text-slate-700">
              New Password
            </Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              required
              className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              required
              className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
            />
          </div>

          <Button
            type="submit"
            disabled={isSigningIn}
            className="h-12 w-full rounded-lg bg-[#5d93c7] text-base font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]"
          >
            {isSigningIn ? "Saving..." : "Save New Password"}
          </Button>

          <button
            type="button"
            onClick={handleBackToSignIn}
            disabled={isSigningIn}
            className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back to sign in
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handlePasswordResetCodeSubmit} className="space-y-5">
        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Enter the reset code sent to {passwordResetFactor.safeIdentifier ?? "your email"}.
        </p>

        <div className="space-y-2">
          <Label htmlFor="reset-code" className="text-sm font-medium text-slate-700">
            Reset Code
          </Label>
          <Input
            key="password-reset-code"
            id="reset-code"
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
          {isSigningIn ? "Verifying..." : "Verify Code"}
        </Button>

        <div className="flex items-center justify-between gap-4 text-sm">
          <button
            type="button"
            onClick={handleResendPasswordResetCode}
            disabled={isSigningIn}
            className="font-medium text-[#5d93c7] transition-colors hover:text-[#4b81b6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={handleBackToSignIn}
            disabled={isSigningIn}
            className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back to sign in
          </button>
        </div>
      </form>
    );
  }

  if (isPasswordResetMode) {
    return (
      <form onSubmit={handlePasswordResetRequestSubmit} className="space-y-5">
        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Enter your username or email and we&apos;ll send a password reset code.
        </p>

        <div className="space-y-2">
          <Label htmlFor="reset-identifier" className="text-sm font-medium text-slate-700">
            Username or Email
          </Label>
          <Input
            id="reset-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Your username or email"
            required
            className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
          />
        </div>

        <Button
          type="submit"
          disabled={isSigningIn}
          className="h-12 w-full rounded-lg bg-[#5d93c7] text-base font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]"
        >
          {isSigningIn ? "Sending..." : "Send Reset Code"}
        </Button>

        <button
          type="button"
          onClick={handleBackToSignIn}
          disabled={isSigningIn}
          className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back to sign in
        </button>
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
        <button
          type="button"
          onClick={() => {
            setErrorMessage(undefined);
            setIsPasswordResetMode(true);
          }}
          disabled={isSigningIn}
          className="text-sm font-medium text-[#5d93c7] transition-colors hover:text-[#4b81b6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Forgot password?
        </button>
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
