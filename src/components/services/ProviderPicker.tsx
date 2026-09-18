"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/features/auth/auth-helpers";
import { createAndLinkProvider, linkExistingProvider } from "@/features/services/manage/save-provider-link";
import { NewProviderForm, type NewProviderFormInput } from "@/components/services/NewProviderForm";
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
      setErrorMessage(getErrorMessage(error, "Could not link that Provider. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreate(input: NewProviderFormInput) {
    await createAndLinkProvider(input);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Link your Provider</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Before you can add or edit services, tell us which Provider you represent.
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
          My Provider is listed
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`px-3 py-2 text-sm font-medium ${
            mode === "create" ? "border-b-2 border-sky-600 text-sky-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          It's a new Provider
        </button>
      </div>

      {mode === "pick" ? (
        <div className="mt-4 space-y-3">
          <Input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Providers..."
            className="h-9 text-sm"
          />

          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200">
            {filteredProviders.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No Providers match your search.</p>
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
        <div className="mt-4">
          <NewProviderForm
            serviceTypes={serviceTypes}
            languages={languages}
            submitLabel="Create Provider"
            submittingLabel="Creating..."
            onSubmit={handleCreate}
          />
        </div>
      )}
    </div>
  );
}
