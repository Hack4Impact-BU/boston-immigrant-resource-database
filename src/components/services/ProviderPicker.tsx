"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getRequiredFormString } from "@/features/auth/auth-helpers";
import { createAndLinkProvider, linkExistingProvider } from "@/features/services/manage/save-provider-link";
import { ServiceTypesPicker } from "@/components/services/ServiceTypesPicker";
import { LanguageSupportPicker } from "@/components/services/LanguageSupportPicker";
import type { Language, Provider, ServiceType } from "@/app/api/airtable";

type ProviderPickerProps = {
  allProviders: Provider[];
  serviceTypes: ServiceType[];
  languages: Language[];
};

export function ProviderPicker({ allProviders, serviceTypes, languages }: ProviderPickerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [search, setSearch] = useState("");
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const filteredProviders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const sorted = [...allProviders].sort((left, right) => left.name.localeCompare(right.name));

    if (!normalizedSearch) {
      return sorted;
    }

    return sorted.filter((provider) => provider.name.toLowerCase().includes(normalizedSearch));
  }, [allProviders, search]);

  async function handlePick(providerId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await linkExistingProvider(providerId);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not link that organization. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      await createAndLinkProvider({
        name: getRequiredFormString(formData, "name"),
        email: getRequiredFormString(formData, "email"),
        website: (formData.get("website") as string | null)?.trim() || undefined,
        primaryPhoneNumber: (formData.get("primaryPhoneNumber") as string | null)?.trim() || undefined,
        description: (formData.get("description") as string | null)?.trim() || undefined,
        address: (formData.get("address") as string | null)?.trim() || undefined,
        serviceTypeIds: selectedServiceTypeIds,
        languageIds: selectedLanguageIds,
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "Could not create your organization. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Link your organization</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Before you can add or edit services, tell us which organization you represent.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{errorMessage}</p>
      )}

      <div className="mt-5 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMode("pick")}
          className={`px-3 py-2 text-sm font-medium ${
            mode === "pick" ? "border-b-2 border-sky-600 text-sky-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          My organization is listed
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`px-3 py-2 text-sm font-medium ${
            mode === "create" ? "border-b-2 border-sky-600 text-sky-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          It's a new organization
        </button>
      </div>

      {mode === "pick" ? (
        <div className="mt-4 space-y-3">
          <Input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search organizations..."
            className="h-9 text-sm"
          />

          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200">
            {filteredProviders.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No organizations match your search.</p>
            ) : (
              filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePick(provider.id)}
                  className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{provider.name}</span>
                  <span className="text-xs text-slate-400">{provider.email}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-slate-500">
              Organization Name
            </Label>
            <Input id="name" name="name" required className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-slate-500">
              Organization Email
            </Label>
            <Input id="email" name="email" type="email" required className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium text-slate-500">
              Website (optional)
            </Label>
            <Input id="website" name="website" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryPhoneNumber" className="text-xs font-medium text-slate-500">
              Phone Number (optional)
            </Label>
            <Input id="primaryPhoneNumber" name="primaryPhoneNumber" type="tel" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-slate-500">
              Description (optional)
            </Label>
            <Textarea id="description" name="description" rows={4} className="text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium text-slate-500">
              Address (optional)
            </Label>
            <Input id="address" name="address" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Service Types (optional)</Label>
            <ServiceTypesPicker
              serviceTypes={serviceTypes}
              selectedIds={selectedServiceTypeIds}
              onChange={setSelectedServiceTypeIds}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">Language Support (optional)</Label>
            <LanguageSupportPicker
              languages={languages}
              selectedIds={selectedLanguageIds}
              onChange={setSelectedLanguageIds}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create organization"}
          </Button>
        </form>
      )}
    </div>
  );
}
