"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";
import { ServiceTypesPicker } from "@/components/services/ServiceTypesPicker";
import { LanguageSupportPicker } from "@/components/services/LanguageSupportPicker";
import type { Language, ServiceType } from "@/app/api/airtable";

export type NewProviderFormInput = {
  name: string;
  email: string;
  website: string;
  primaryPhoneNumber: string;
  secondaryPhoneNumber?: string;
  description: string;
  address: string;
  serviceTypeIds: string[];
  languageIds: string[];
};

type NewProviderFormProps = {
  serviceTypes: ServiceType[];
  languages: Language[];
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: NewProviderFormInput) => Promise<void>;
};

export function NewProviderForm({ serviceTypes, languages, submitLabel, submittingLabel, onSubmit }: NewProviderFormProps) {
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(undefined);

    if (selectedServiceTypeIds.length === 0) {
      setErrorMessage("Please select at least one service type.");
      return;
    }

    if (selectedLanguageIds.length === 0) {
      setErrorMessage("Please select at least one language.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await onSubmit({
        name: getRequiredFormString(formData, "name"),
        email: getRequiredFormString(formData, "email"),
        website: getRequiredFormString(formData, "website"),
        primaryPhoneNumber: getRequiredFormString(formData, "primaryPhoneNumber"),
        secondaryPhoneNumber: (formData.get("secondaryPhoneNumber") as string | null)?.trim() || undefined,
        description: getRequiredFormString(formData, "description"),
        address: getRequiredFormString(formData, "address"),
        serviceTypeIds: selectedServiceTypeIds,
        languageIds: selectedLanguageIds,
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not create the Provider. Please try again."));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorMessage}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium text-slate-500">
          Provider Name
        </Label>
        <Input id="name" name="name" required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-slate-500">
          Provider Email
        </Label>
        <Input id="email" name="email" type="email" required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website" className="text-xs font-medium text-slate-500">
          Website
        </Label>
        <Input id="website" name="website" required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="primaryPhoneNumber" className="text-xs font-medium text-slate-500">
          Phone Number
        </Label>
        <Input id="primaryPhoneNumber" name="primaryPhoneNumber" type="tel" required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="secondaryPhoneNumber" className="text-xs font-medium text-slate-500">
          Secondary Phone Number (optional)
        </Label>
        <Input id="secondaryPhoneNumber" name="secondaryPhoneNumber" type="tel" className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-medium text-slate-500">
          Address
        </Label>
        <Input id="address" name="address" required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-medium text-slate-500">
          Description
        </Label>
        <Textarea id="description" name="description" rows={4} required className="text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-500">Service Types</Label>
        <ServiceTypesPicker
          serviceTypes={serviceTypes}
          selectedIds={selectedServiceTypeIds}
          onChange={setSelectedServiceTypeIds}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-500">Language Support</Label>
        <LanguageSupportPicker languages={languages} selectedIds={selectedLanguageIds} onChange={setSelectedLanguageIds} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
