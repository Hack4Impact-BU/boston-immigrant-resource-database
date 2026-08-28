"use server";

import { auth } from "@clerk/nextjs/server";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { createProvider, getProviderById } from "@/app/api/airtable";
import { linkUserToProvider } from "@/lib/airtable";

export type CreateAndLinkProviderInput = {
  name: string;
  email: string;
  website?: string;
  primaryPhoneNumber?: string;
  description?: string;
  address?: string;
  serviceTypeIds?: string[];
  languageIds?: string[];
};

async function requireSignedInUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  return userId;
}

/**
 * Links the current account to an existing Provider record the person picked from
 * the directory (the "my organization is already listed" path).
 */
export async function linkExistingProvider(providerId: string): Promise<void> {
  const userId = await requireSignedInUserId();
  const trimmedProviderId = requireNonEmptyString(providerId, "providerId");

  const provider = await getProviderById(trimmedProviderId);

  if (!provider) {
    throw new Error("That organization could not be found. Please pick it from the list again.");
  }

  await linkUserToProvider(userId, trimmedProviderId);
}

/**
 * Creates a brand-new Provider record for an organization that isn't in the
 * directory yet, and links the current account to it in the same step.
 */
export async function createAndLinkProvider(input: CreateAndLinkProviderInput): Promise<{ id: string }> {
  const userId = await requireSignedInUserId();

  const { id } = await createProvider({
    name: requireNonEmptyString(input.name, "name"),
    email: requireNonEmptyString(input.email, "email"),
    website: input.website?.trim() || undefined,
    primary_phone_number: input.primaryPhoneNumber?.trim() || undefined,
    description: input.description?.trim() || undefined,
    address: input.address?.trim() || undefined,
    serviceTypeIds: input.serviceTypeIds,
    languageIds: input.languageIds,
  });

  await linkUserToProvider(userId, id);

  return { id };
}
