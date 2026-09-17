"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { updateProvider } from "@/app/api/airtable";
import { getUserProviderId, getUserRole } from "@/lib/airtable";

export type SaveProviderFormInput = {
  name: string;
  email: string;
  website?: string;
  primaryPhoneNumber?: string;
  secondaryPhoneNumber?: string;
  address?: string;
  description?: string;
  serviceTypeIds: string[];
  languageIds: string[];
};

/**
 * Updates a Provider's profile. Ownership is normally a direct equality check
 * against the signed-in user's own linked providerId — but Admins are allowed
 * to edit any Provider ("as if a Provider for all organizations"), and Viewers
 * are blocked from writing at all, regardless of whether they happen to be
 * linked to a Provider.
 */
export async function updateProviderAction(providerId: string, input: SaveProviderFormInput): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const [role, linkedProviderId] = await Promise.all([getUserRole(userId), getUserProviderId(userId)]);

  // Deliberately an allowlist: only an explicit "Provider" or "Admin" role may
  // write. A missing/unset role is blocked, same as Viewer, rather than
  // assumed safe.
  if (role !== "Provider" && role !== "Admin") {
    throw new Error("Your account doesn't have permission to make changes.");
  }

  const isAdmin = role === "Admin";

  if (!isAdmin && (!linkedProviderId || linkedProviderId !== providerId)) {
    throw new Error("You don't have permission to edit this Provider.");
  }

  await updateProvider(providerId, {
    name: requireNonEmptyString(input.name, "name"),
    email: requireNonEmptyString(input.email, "email"),
    website: input.website?.trim() || "",
    primary_phone_number: input.primaryPhoneNumber?.trim() || "",
    secondary_phone_number: input.secondaryPhoneNumber?.trim() || "",
    address: input.address?.trim() || "",
    description: input.description?.trim() || "",
    serviceTypeIds: input.serviceTypeIds,
    languageIds: input.languageIds,
  });

  revalidatePath(`/providers/${providerId}`);
  revalidatePath("/providers");
  revalidatePath("/services/manage");
}
