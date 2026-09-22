"use server";

import { auth } from "@clerk/nextjs/server";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { createProvider, getProviderById } from "@/app/api/airtable";
import { getUserRole, linkUserToProvider } from "@/lib/airtable";

export type CreateAndLinkProviderInput = {
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

// Server-side enforcement of the same fields the form marks as required —
// client-side validation alone isn't a real guarantee, since a Server Action
// is reachable directly, not only through the form's own UI.
function requireNonEmptySelection(values: string[], fieldName: string): string[] {
  if (values.length === 0) {
    throw new Error(`Please select at least one ${fieldName}.`);
  }

  return values;
}

// Viewer accounts represent users/organizations that don't offer Services
// themselves — linking or creating a Provider is fundamentally "becoming a
// Provider", which doesn't apply to that role. Deliberately an allowlist: a
// missing/unset role is blocked the same as Viewer, not assumed safe.
async function requireSignedInUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const role = await getUserRole(userId);

  if (role !== "Provider" && role !== "Admin") {
    throw new Error("Your account doesn't have permission to register as a Provider.");
  }

  return userId;
}

/**
 * Links the current account to an existing Provider record the person picked from
 * the directory (the "my Provider is already listed" path).
 */
export async function linkExistingProvider(providerId: string): Promise<void> {
  const userId = await requireSignedInUserId();
  const trimmedProviderId = requireNonEmptyString(providerId, "providerId");

  const provider = await getProviderById(trimmedProviderId);

  if (!provider) {
    throw new Error("That Provider could not be found. Please pick it from the list again.");
  }

  await linkUserToProvider(userId, trimmedProviderId);
}

/**
 * Creates a brand-new Provider record for a Provider that isn't in the
 * directory yet, and links the current account to it in the same step.
 */
export async function createAndLinkProvider(input: CreateAndLinkProviderInput): Promise<{ id: string }> {
  const userId = await requireSignedInUserId();

  const { id } = await createProvider({
    name: requireNonEmptyString(input.name, "name"),
    email: requireNonEmptyString(input.email, "email"),
    website: requireNonEmptyString(input.website, "website"),
    primary_phone_number: requireNonEmptyString(input.primaryPhoneNumber, "phone number"),
    secondary_phone_number: input.secondaryPhoneNumber?.trim() || undefined,
    description: requireNonEmptyString(input.description, "description"),
    address: requireNonEmptyString(input.address, "address"),
    serviceTypeIds: requireNonEmptySelection(input.serviceTypeIds, "service type"),
    languageIds: requireNonEmptySelection(input.languageIds, "language"),
  });

  await linkUserToProvider(userId, id);

  return { id };
}

/**
 * Creates a brand-new, standalone Provider record with no account linked to it —
 * for an Admin adding an organization to the directory before that organization
 * has registered its own account. Deliberately does NOT call linkUserToProvider:
 * unlike createAndLinkProvider (used when a person is registering their own
 * organization), linking this to the Admin's own account would be wrong, since
 * the Admin isn't the organization behind this listing. The actual organization
 * links themselves to it later via the existing "my Provider is already listed"
 * flow once they register.
 */
export async function createProviderAsAdmin(input: CreateAndLinkProviderInput): Promise<{ id: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const role = await getUserRole(userId);

  if (role !== "Admin") {
    throw new Error("Only Admins can add a Provider this way.");
  }

  return createProvider({
    name: requireNonEmptyString(input.name, "name"),
    email: requireNonEmptyString(input.email, "email"),
    website: requireNonEmptyString(input.website, "website"),
    primary_phone_number: requireNonEmptyString(input.primaryPhoneNumber, "phone number"),
    secondary_phone_number: input.secondaryPhoneNumber?.trim() || undefined,
    description: requireNonEmptyString(input.description, "description"),
    address: requireNonEmptyString(input.address, "address"),
    serviceTypeIds: requireNonEmptySelection(input.serviceTypeIds, "service type"),
    languageIds: requireNonEmptySelection(input.languageIds, "language"),
  });
}
