"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { updateProvider } from "@/app/api/airtable";
import { getUserProviderId } from "@/lib/airtable";

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
 * Updates a Provider's own profile. Unlike Services, a Provider's "owner" isn't a
 * field to look up on the record itself — it's simply whichever account has this
 * exact providerId set on their User record. So the ownership check here is a
 * direct equality check against the signed-in user's own link, not a fetch-then-compare.
 */
export async function updateProviderAction(providerId: string, input: SaveProviderFormInput): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const linkedProviderId = await getUserProviderId(userId);

  if (!linkedProviderId || linkedProviderId !== providerId) {
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
