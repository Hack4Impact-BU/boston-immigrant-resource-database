"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";
import { ServiceTypesPicker } from "@/components/services/ServiceTypesPicker";
import { LanguageSupportPicker } from "@/components/services/LanguageSupportPicker";
import type { Language, Provider, ServiceType } from "@/app/api/airtable";
import type { SaveProviderFormInput } from "@/features/services/manage/save-provider";

type ProviderEditFormProps = {
  provider: Provider;
  serviceTypes: ServiceType[];
  languages: Language[];
  onSubmit: (input: SaveProviderFormInput) => Promise<void>;
  cancelHref: string;
};

export function ProviderEditForm({ provider, serviceTypes, languages, onSubmit, cancelHref }: ProviderEditFormProps) {
  const router = useRouter();
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(provider.service_type_ids);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(provider.language_ids);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await onSubmit({
        name: getRequiredFormString(formData, "name"),
        email: getRequiredFormString(formData, "email"),
        website: (formData.get("website") as string | null)?.trim() || undefined,
        primaryPhoneNumber: (formData.get("primaryPhoneNumber") as string | null)?.trim() || undefined,
        secondaryPhoneNumber: (formData.get("secondaryPhoneNumber") as string | null)?.trim() || undefined,
        address: (formData.get("address") as string | null)?.trim() || undefined,
        description: (formData.get("description") as string | null)?.trim() || undefined,
        serviceTypeIds: selectedServiceTypeIds,
        languageIds: selectedLanguageIds,
      });

      router.push(cancelHref);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not save these changes. Please try again."));
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
          Provider Name
        </Label>
        <Input id="name" name="name" required defaultValue={provider.name} className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-slate-500">
          Email
        </Label>
        <Input id="email" name="email" type="email" required defaultValue={provider.email} className="h-9 text-sm" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="primaryPhoneNumber" className="text-xs font-medium text-slate-500">
            Primary Phone Number
          </Label>
          <Input
            id="primaryPhoneNumber"
            name="primaryPhoneNumber"
            type="tel"
            defaultValue={provider.primary_phone_number}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="secondaryPhoneNumber" className="text-xs font-medium text-slate-500">
            Secondary Phone Number (optional)
          </Label>
          <Input
            id="secondaryPhoneNumber"
            name="secondaryPhoneNumber"
            type="tel"
            defaultValue={provider.secondary_phone_number}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website" className="text-xs font-medium text-slate-500">
          Website (optional)
        </Label>
        <Input id="website" name="website" type="url" defaultValue={provider.website} className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-medium text-slate-500">
          Address (optional)
        </Label>
        <Input id="address" name="address" defaultValue={provider.address} className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-medium text-slate-500">
          Description (optional)
        </Label>
        <Textarea id="description" name="description" rows={10} defaultValue={provider.description} className="text-sm" />
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
        <LanguageSupportPicker
          languages={languages}
          selectedIds={selectedLanguageIds}
          onChange={setSelectedLanguageIds}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => router.push(cancelHref)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
