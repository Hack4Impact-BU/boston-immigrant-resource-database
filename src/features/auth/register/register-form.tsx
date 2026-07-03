"use client";

import { useClerk } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";

import { saveRegisteredUser, type SaveRegisteredUserInput } from "./save-registered-user";
import { useClerkSignUp } from "./use-clerk-sign-up";

type PendingRegisteredUserInput = Omit<SaveRegisteredUserInput, "clerkUserId">;

export function RegisterForm() {
  const router = useRouter();
  const { signOut } = useClerk();
  const {
    activateClerkSession,
    createClerkSignUp,
    isSubmitting,
    verifyEmailCode,
  } = useClerkSignUp();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [pendingUserInput, setPendingUserInput] = useState<PendingRegisteredUserInput>();

  const isBusy = isSubmitting || isSavingUser;

  async function saveProfileAndRedirect(userInput: SaveRegisteredUserInput) {
    setIsSavingUser(true);

    try {
      await saveRegisteredUser(userInput);
      await activateClerkSession();
      router.push("/contact");
    } catch (error) {
      try {
        await signOut();
      } catch {
        // The Clerk user was deleted server-side; ignore stale client session cleanup failures.
      }

      setNeedsEmailVerification(false);
      setPendingUserInput(undefined);
      setErrorMessage(getErrorMessage(error, "Registration could not be completed."));
    } finally {
      setIsSavingUser(false);
    }
  }

  async function finishRegistration(userInput: PendingRegisteredUserInput, clerkUserId: string | null) {
    await saveProfileAndRedirect({
      ...userInput,
      clerkUserId,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const userInput = {
      organizationName: getRequiredFormString(formData, "organizationName"),
      website: getRequiredFormString(formData, "website"),
      phoneNumber: getRequiredFormString(formData, "primaryPhoneNumber"),
      email: getRequiredFormString(formData, "email"),
    };
    const password = getRequiredFormString(formData, "password");
    const confirmPassword = getRequiredFormString(formData, "confirmPassword");
    const username = getRequiredFormString(formData, "username");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const result = await createClerkSignUp({
        email: userInput.email,
        username,
        password,
      });

      setPendingUserInput(userInput);

      if (result.needsEmailVerification) {
        setNeedsEmailVerification(true);
        return;
      }

      await finishRegistration(userInput, result.clerkUserId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Registration could not be completed."));
    }
  }

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const code = getRequiredFormString(formData, "verificationCode");

    if (!pendingUserInput) {
      setErrorMessage("Registration details are missing. Please start again.");
      setNeedsEmailVerification(false);
      return;
    }

    try {
      const result = await verifyEmailCode(code);
      setNeedsEmailVerification(false);
      await finishRegistration(pendingUserInput, result.clerkUserId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Registration could not be completed."));
    }
  }

  if (needsEmailVerification) {
    return (
      <form
        key="verification-form"
        onSubmit={handleVerificationSubmit}
        className="mx-auto flex max-w-80.5 flex-col gap-3.5"
      >
        {errorMessage && (
          <p className="rounded-[0.22rem] bg-red-50 px-3 py-2 text-[0.72rem] font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="verificationCode" className="text-xs font-medium text-slate-500">
            Email Verification Code
          </Label>
          <Input
            id="verificationCode"
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Verification Code"
            required
            className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
          />
        </div>

        <Button
          type="submit"
          disabled={isBusy}
          className="mt-6 h-10 rounded-[0.22rem] bg-[#5d93c7] text-base font-semibold text-white shadow-[0_8px_18px_rgba(93,147,199,0.22)] transition-colors hover:bg-[#4b81b6]"
        >
          {isBusy ? "Finishing..." : "Finish"}
        </Button>
      </form>
    );
  }

  return (
    <form
      key="registration-form"
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-80.5 flex-col gap-3.5"
    >
      {errorMessage && (
        <p className="rounded-[0.22rem] bg-red-50 px-3 py-2 text-[0.72rem] font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="organizationName" className="text-xs font-medium text-slate-500">
          Organization Name
        </Label>
        <Input
          id="organizationName"
          name="organizationName"
          type="text"
          placeholder="Organization Name"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website" className="text-xs font-medium text-slate-500">
          Website
        </Label>
        <Input
          id="website"
          name="website"
          placeholder="Website"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="primaryPhoneNumber" className="text-xs font-medium text-slate-500">
          Primary Phone Number
        </Label>
        <Input
          id="primaryPhoneNumber"
          name="primaryPhoneNumber"
          type="tel"
          placeholder="Primary Phone Number"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-slate-500">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-medium text-slate-500">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Username"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-slate-500">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Your Password"
          required
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-500">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Your Password"
          className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
        />
      </div>

      <Button
        type="submit"
        disabled={isBusy}
        className="mt-6 h-10 rounded-[0.22rem] bg-[#5d93c7] text-base font-semibold text-white shadow-[0_8px_18px_rgba(93,147,199,0.22)] transition-colors hover:bg-[#4b81b6]"
      >
        {isBusy ? "Finishing..." : "Finish"}
      </Button>
    </form>
  );
}
