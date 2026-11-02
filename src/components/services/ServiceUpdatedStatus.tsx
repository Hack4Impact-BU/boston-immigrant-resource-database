"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Check, LoaderCircle } from "lucide-react";

import { markServiceUpToDateAction } from "@/features/services/manage/save-service";

// How long "Up to date" stays beside the date after it has been saved.
const DONE_MESSAGE_DURATION_MS = 4000;

type ServiceUpdatedStatusProps = {
  serviceId: string;
  serviceName: string;
  /** "Updated 9 days ago" and so on: worked out on the server, so that the page and the browser can't disagree about it. */
  updatedLabel: string;
  /** Whether that text says "Updated today". If it does there is nothing to confirm, and there is no button. */
  isUpdatedToday: boolean;
};

/**
 * The "Updated 9 days ago" text of a service on the Manage My Services page, and beside it a button to mark the service up to date
 * (for a provider who has checked it and has nothing to change, so they don't have to Edit it and save it again). The button isn't
 * there for a service that was updated today. Once it is saved the text says so, "Up to date" shows for a few seconds, and then
 * only the text is left.
 */
export function ServiceUpdatedStatus({ serviceId, serviceName, updatedLabel, isUpdatedToday }: ServiceUpdatedStatusProps) {
  const [phase, setPhase] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const labelRef = useRef<HTMLParagraphElement>(null);
  // A second click can arrive before the first one has re-rendered the button as disabled.
  const isSavingRef = useRef(false);
  const doneTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(doneTimerRef.current);
  }, []);

  async function handleMarkUpToDate() {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setPhase("saving");
    setErrorMessage(undefined);

    let result: Awaited<ReturnType<typeof markServiceUpToDateAction>>;

    try {
      result = await markServiceUpToDateAction(serviceId);
    } catch (error) {
      console.error(error);
      result = { ok: false, message: "Couldn't save. Please try again." };
    }

    isSavingRef.current = false;

    if (!result.ok) {
      setErrorMessage(result.message);
      setPhase("error");
      return;
    }

    setHasConfirmed(true);
    setPhase("done");
    // The button is about to go, and with it the keyboard focus: the date text is what stays, so it gets the focus.
    labelRef.current?.focus({ preventScroll: true });
    doneTimerRef.current = window.setTimeout(() => setPhase("idle"), DONE_MESSAGE_DURATION_MS);
  }

  const isUpToDate = isUpdatedToday || hasConfirmed;
  const label = hasConfirmed ? (phase === "done" ? "Updated just now" : "Updated today") : updatedLabel;

  return (
    <>
      <p ref={labelRef} tabIndex={-1} className={`text-[13px] outline-none ${phase === "done" ? "font-medium text-green-800" : "text-slate-500"}`}>
        {label}
      </p>

      {phase === "done" ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-[13px] font-medium text-green-800">
          <Check className="h-4 w-4" aria-hidden="true" />
          Up to date
        </span>
      ) : null}

      {!isUpToDate ? (
        <button
          type="button"
          onClick={handleMarkUpToDate}
          disabled={phase === "saving"}
          aria-busy={phase === "saving"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
            phase === "error"
              ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-100 focus-visible:outline-red-600"
              : "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:outline-sky-600"
          }`}
        >
          {phase === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          <span>{phase === "saving" ? "Saving…" : phase === "error" ? "Try again" : "Mark up to date"}</span>
          <span className="sr-only"> for {serviceName}</span>
        </button>
      ) : null}

      {phase === "error" && errorMessage ? (
        <span role="alert" className="text-[13px] text-red-800">
          {errorMessage}
        </span>
      ) : null}

      <span role="status" className="sr-only">
        {phase === "done" ? `${serviceName} marked up to date.` : ""}
      </span>
    </>
  );
}
