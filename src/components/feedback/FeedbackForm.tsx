"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/features/auth/auth-helpers";
import { submitFeedback } from "@/features/feedback/submit-feedback";

const FEEDBACK_TYPES = ["Support / Help", "New Service Type", "Bug", "Suggestion", "Comment", "Other"] as const;

type FeedbackFormProps = {
  defaultEmail: string;
};

export function FeedbackForm({ defaultEmail }: FeedbackFormProps) {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<string>(FEEDBACK_TYPES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    try {
      const feedbackText = (formData.get("feedbackText") as string | null)?.trim() ?? "";
      const emailEntered = (formData.get("email") as string | null)?.trim() ?? "";

      await submitFeedback({ emailEntered, feedbackType, feedbackText });

      setIsSubmitted(true);
      formElement.reset();
      setFeedbackType(FEEDBACK_TYPES[0]);
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not submit your feedback. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Thank you for your feedback!</h2>
        <p className="mt-2 text-sm text-slate-600">We&apos;ve received your submission and will review it soon.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button type="button" onClick={() => setIsSubmitted(false)}>
            Submit another
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/map")}>
            Back to BIRD
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorMessage}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-slate-500">
          Your email
        </Label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required className="h-9 text-sm" />
        {!defaultEmail && (
          <p className="text-xs text-amber-600">
            We couldn&apos;t automatically detect your account email — please enter it below.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-500">What's this about?</Label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFeedbackType(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                feedbackType === type
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedbackText" className="text-xs font-medium text-slate-500">
          Your message
        </Label>
        <Textarea id="feedbackText" name="feedbackText" rows={8} required className="text-sm" />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
