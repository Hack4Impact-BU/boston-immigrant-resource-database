"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { createService, getServiceById, updateService } from "@/app/api/airtable";
import { getUserProviderId } from "@/lib/airtable";

export type SaveServiceFormInput = {
  name: string;
  description?: string;
  status: string;
  link?: string;
  serviceTypeIds: string[];
};

async function requireCurrentProviderId(): Promise<{ userId: string; providerId: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const providerId = await getUserProviderId(userId);

  if (!providerId) {
    throw new Error("Your account isn't linked to an organization yet.");
  }

  return { userId, providerId };
}

export async function createServiceAction(input: SaveServiceFormInput): Promise<{ id: string }> {
  const { providerId } = await requireCurrentProviderId();

  const result = await createService({
    providerId,
    name: requireNonEmptyString(input.name, "name"),
    status: requireNonEmptyString(input.status, "status"),
    description: input.description?.trim() || undefined,
    link: input.link?.trim() || undefined,
    serviceTypeIds: input.serviceTypeIds,
  });

  revalidatePath("/services/manage");
  revalidatePath("/map");

  return result;
}

export async function updateServiceAction(serviceId: string, input: SaveServiceFormInput): Promise<void> {
  const { providerId } = await requireCurrentProviderId();

  const existingService = await getServiceById(serviceId);

  if (!existingService) {
    throw new Error("This service could not be found.");
  }

  // Ownership check: never trust that a serviceId submitted from the client belongs
  // to the current user's organization just because they were on the edit page for
  // it. Server Actions are reachable directly via POST, not just through this UI.
  const belongsToCurrentProvider =
    existingService.provider === providerId || existingService.provider_record_ID === providerId;

  if (!belongsToCurrentProvider) {
    throw new Error("You don't have permission to edit this service.");
  }

  await updateService(serviceId, {
    name: requireNonEmptyString(input.name, "name"),
    status: requireNonEmptyString(input.status, "status"),
    description: input.description?.trim() || "",
    link: input.link?.trim() || "",
    serviceTypeIds: input.serviceTypeIds,
  });

  revalidatePath("/services/manage");
  revalidatePath("/map");
}
