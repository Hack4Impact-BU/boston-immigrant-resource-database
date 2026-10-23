"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteServiceAction } from "@/features/services/manage/save-service";

type DeleteServiceButtonProps = {
  serviceId: string;
  serviceName: string;
};

export function DeleteServiceButton({ serviceId, serviceName }: DeleteServiceButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setErrorMessage(undefined);

    try {
      await deleteServiceAction(serviceId);
      // No router.refresh() needed: the Server Action already revalidates
      // /services/manage, so this row disappears once the action resolves.
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Could not delete this service.");
      setIsDeleting(false);
      setIsConfirming(false);
    }
  }

  if (isConfirming) {
    return (
      // The row can wrap, and the question can wrap within 16rem, because the service name is in it: a long name on a single line
      // pushed the Confirm and Cancel buttons out past the edge of the card.
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
        <span className="min-w-0 max-w-[16rem] break-words text-right text-[13px] text-slate-600">Delete {serviceName}?</span>
        <button
          type="button"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-2.5 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {errorMessage && <span className="text-[13px] text-red-600">{errorMessage}</span>}
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={`Delete ${serviceName}`}
        className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
