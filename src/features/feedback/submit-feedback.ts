"use server";

import { auth } from "@clerk/nextjs/server";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { createUserFeedback, getUserProfileForFeedback } from "@/lib/airtable";

export type SubmitFeedbackInput = {
  emailEntered: string;
  feedbackType: string;
  feedbackText: string;
};

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to submit feedback.");
  }

  const emailEntered = requireNonEmptyString(input.emailEntered, "emailEntered");

  // Pulling the account's name/email automatically is the normal path, but
  // this exact mechanism has failed before in production on a different
  // platform. If it fails here too, fall back to what the user submitted
  // (pre-filled from their account, but editable) rather than blocking the
  // submission entirely — the same role "Email Entered" served historically.
  const profile = await getUserProfileForFeedback(userId);

  await createUserFeedback({
    name: profile?.name ?? emailEntered,
    email: profile?.email ?? emailEntered,
    emailEntered,
    feedbackType: requireNonEmptyString(input.feedbackType, "feedbackType"),
    feedbackText: requireNonEmptyString(input.feedbackText, "feedbackText"),
  });
}
