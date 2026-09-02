"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";
import { ServiceTypesPicker } from "@/components/services/ServiceTypesPicker";
import type { ServiceType } from "@/app/api/airtable";
import type { SaveServiceFormInput } from "@/features/services/manage/save-service";

const STATUS_OPTIONS = ["Open", "Waitlist", "Contact Provider", "Full"] as const;

type ServiceFormInitialValues = {
  name: string;
  description: string;
  status: string;
  link: string;
  serviceTypeIds: string[];
};

type ServiceFormProps = {
  serviceTypes: ServiceType[];
  initialValues?: ServiceFormInitialValues;
  submitLabel: string;
  onSubmit: (input: SaveServiceFormInput) => Promise<void>;
};

export function ServiceForm({ serviceTypes, initialValues, submitLabel, onSubmit }: ServiceFormProps) {
  const router = useRouter();
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(
    initialValues?.serviceTypeIds ?? []
  );
  const [status, setStatus] = useState(initialValues?.status ?? STATUS_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const name = getRequiredFormString(formData, "name");
      const description = (formData.get("description") as string | null)?.trim() ?? "";
      const link = (formData.get("link") as string | null)?.trim() ?? "";

      await onSubmit({
        name,
        description,
        link,
        status,
        serviceTypeIds: selectedServiceTypeIds,
      });

      router.push("/services/manage");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not save this service. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorMessage}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium text-slate-500">
          Service Name
        </Label>
        <Input id="name" name="name" required defaultValue={initialValues?.name} className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-medium text-slate-500">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={initialValues?.description}
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="link" className="text-xs font-medium text-slate-500">
          Registration / Info Link (optional)
        </Label>
        <Input id="link" name="link" type="url" defaultValue={initialValues?.link} className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-500">Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === option
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-500">Service Types</Label>
        <ServiceTypesPicker
          serviceTypes={serviceTypes}
          selectedIds={selectedServiceTypeIds}
          onChange={setSelectedServiceTypeIds}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
