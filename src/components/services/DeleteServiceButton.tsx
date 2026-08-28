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
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-slate-600">Delete {serviceName}?</span>
        <button
          type="button"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {errorMessage && <span className="text-xs text-red-600">{errorMessage}</span>}
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
