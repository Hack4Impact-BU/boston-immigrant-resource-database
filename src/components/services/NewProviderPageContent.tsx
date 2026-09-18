"use client";

import { useRouter } from "next/navigation";

import { NewProviderForm, type NewProviderFormInput } from "@/components/services/NewProviderForm";
import { createProviderAsAdmin } from "@/features/services/manage/save-provider-link";
import type { Language, ServiceType } from "@/app/api/airtable";

type NewProviderPageContentProps = {
  serviceTypes: ServiceType[];
  languages: Language[];
};

export function NewProviderPageContent({ serviceTypes, languages }: NewProviderPageContentProps) {
  const router = useRouter();

  async function handleCreate(input: NewProviderFormInput) {
    const { id } = await createProviderAsAdmin(input);
    router.push(`/providers/${id}`);
  }

  return (
    <NewProviderForm
      serviceTypes={serviceTypes}
      languages={languages}
      submitLabel="Add Provider"
      submittingLabel="Adding..."
      onSubmit={handleCreate}
    />
  );
}
