"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireNonEmptySelection, requireNonEmptyString } from "@/features/auth/auth-helpers";
import { confirmService, createService, deleteService, getServiceById, updateService, type Service } from "@/app/api/airtable";
import { getUserProviderId, getUserRole } from "@/lib/airtable";

export type SaveServiceFormInput = {
  name: string;
  description?: string;
  status: string;
  link?: string;
  serviceTypeIds: string[];
};

type AuthContext = {
  userId: string;
  role: string | null;
  providerId: string | null;
};

/**
 * A missing/unset role is treated the same as "Provider" (the original, only
 * behavior this app had before roles existed) rather than as "Viewer" — so
 * accounts created before this feature existed keep working exactly as they
 * did, without needing a backfill. New users/accounts that should have a 
 * "Viewer" role based on the MOU filled out will need the BIRD Admin to 
 * manually update the userRole directly in the database.
 */
async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to do this.");
  }

  const [role, providerId] = await Promise.all([getUserRole(userId), getUserProviderId(userId)]);

  return { userId, role, providerId };
}

/**
 * Deliberately an allowlist, not a blocklist: only an explicit "Provider" or
 * "Admin" role may write. A missing/unset role is treated the same as
 * Viewer — blocked — rather than assumed safe, since defaulting to permissive
 * here would silently grant write access to any account a role was never set
 * for, including by mistake.
 */
function assertCanWrite(context: AuthContext): void {
  if (context.role !== "Provider" && context.role !== "Admin") {
    throw new Error("Your account doesn't have permission to make changes.");
  }
}

// Unlike requireCurrentProviderId (used for the original "Manage My Services"
// flow, where the provider is implicit), this action can now also be reached
// from an arbitrary Provider's own page — so the providerId is explicit, and
// this checks whether the caller may actually create a service for it.
function assertCanCreateForProvider(context: AuthContext, providerId: string): void {
  if (context.role === "Admin") {
    return;
  }

  if (context.providerId !== providerId) {
    throw new Error("You don't have permission to create a service for this provider.");
  }
}

// Never trust that a serviceId submitted from the client belongs to the current
// user's Provider just because they were on that service's page in the UI.
// Server Actions are reachable directly via POST, not just through this app, so
// ownership has to be re-checked here on every call, not assumed from the route.
async function requireOwnedService(serviceId: string, context: AuthContext): Promise<Service> {
  const existingService = await getServiceById(serviceId);

  if (!existingService) {
    throw new Error("This service could not be found.");
  }

  // Admins can edit any Provider's services, matching the "as if a Provider
  // for all organizations" role definition — no ownership check applies.
  if (context.role === "Admin") {
    return existingService;
  }

  const belongsToCurrentProvider =
    context.providerId != null &&
    (existingService.provider === context.providerId || existingService.provider_record_ID === context.providerId);

  if (!belongsToCurrentProvider) {
    throw new Error("You don't have permission to modify this service.");
  }

  return existingService;
}

export async function createServiceAction(providerId: string, input: SaveServiceFormInput): Promise<{ id: string }> {
  const context = await getAuthContext();
  assertCanWrite(context);
  assertCanCreateForProvider(context, providerId);

  const result = await createService({
    providerId,
    name: requireNonEmptyString(input.name, "name"),
    status: requireNonEmptyString(input.status, "status"),
    description: input.description?.trim() || undefined,
    link: input.link?.trim() || undefined,
    serviceTypeIds: requireNonEmptySelection(input.serviceTypeIds, "service type"),
  });

  revalidatePath("/services/manage");
  revalidatePath("/map");
  revalidatePath(`/providers/${providerId}`);

  return result;
}

export async function updateServiceAction(serviceId: string, input: SaveServiceFormInput): Promise<void> {
  const context = await getAuthContext();
  assertCanWrite(context);

  const existingService = await requireOwnedService(serviceId, context);

  await updateService(serviceId, {
    name: requireNonEmptyString(input.name, "name"),
    status: requireNonEmptyString(input.status, "status"),
    description: input.description?.trim() || "",
    link: input.link?.trim() || "",
    serviceTypeIds: requireNonEmptySelection(input.serviceTypeIds, "service type"),
  });

  revalidatePath("/services/manage");
  revalidatePath("/map");
  revalidatePath(`/providers/${existingService.provider_record_ID}`);
}

export async function deleteServiceAction(serviceId: string): Promise<void> {
  const context = await getAuthContext();
  assertCanWrite(context);

  const existingService = await requireOwnedService(serviceId, context);

  await deleteService(serviceId);

  revalidatePath("/services/manage");
  revalidatePath("/map");
  revalidatePath(`/providers/${existingService.provider_record_ID}`);
}

export type MarkServiceUpToDateResult = { ok: true; confirmedAt: string } | { ok: false; message: string };

// The reasons this can fail that the person can do something about (signed out, no permission, service gone) come back as a message to
// show them; anything else (Airtable, say) is logged here, and they are only told to try again. It returns a result and doesn't throw,
// because in production the message of an error thrown from a Server Action doesn't reach the browser.
export async function markServiceUpToDateAction(serviceId: string): Promise<MarkServiceUpToDateResult> {
  let existingService: Service;

  try {
    const context = await getAuthContext();
    assertCanWrite(context);

    existingService = await requireOwnedService(serviceId, context);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update this service." };
  }

  let confirmedAt: string;

  try {
    confirmedAt = await confirmService(serviceId);
  } catch (error) {
    console.error(`markServiceUpToDateAction: could not set Last Confirmed on service ${serviceId}: ${String(error)}`);

    return { ok: false, message: "Couldn't save. Please try again." };
  }

  revalidatePath("/services/manage");
  revalidatePath("/map");
  revalidatePath(`/providers/${existingService.provider_record_ID}`);

  return { ok: true, confirmedAt };
}
