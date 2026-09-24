"use server";

import { auth } from "@clerk/nextjs/server";

import {
  ADMIN_USER_ACCESS_OPTIONS,
  ADMIN_USER_ROLE_OPTIONS,
  getUserRole,
  updateUserAsAdmin,
  type UpdateUserAsAdminInput,
} from "@/lib/airtable";

/**
 * Throws unless the signed-in user is an Admin. Every export below calls this
 * first — a Server Action is reachable directly, not only through this page's own
 * UI, so the role check has to live here rather than only in the page component.
 */
async function requireAdmin(): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const role = await getUserRole(userId);

  if (role !== "Admin") {
    throw new Error("You must be an Admin to do this.");
  }
}

export type UpdateUserFieldInput = {
  recordId: string;
  field: keyof UpdateUserAsAdminInput;
  value: string;
};

/**
 * Updates a single field on a single User record, from the Manage Users table's
 * save-on-blur editing. Takes one field at a time (rather than a whole-row object)
 * so one cell's save can't accidentally overwrite a sibling cell's own, separate
 * in-progress edit with stale data.
 */
export async function updateUserFieldAction(input: UpdateUserFieldInput): Promise<void> {
  await requireAdmin();

  const value = input.value.trim();

  if (input.field === "userRole") {
    // Blank is a deliberately valid state here — new registrations not carried
    // over from the Old Softr Users table start with no role assigned yet.
    if (value !== "" && !ADMIN_USER_ROLE_OPTIONS.includes(value as (typeof ADMIN_USER_ROLE_OPTIONS)[number])) {
      throw new Error(`"${value}" is not a valid role.`);
    }

    await updateUserAsAdmin(input.recordId, { userRole: value });
    return;
  }

  if (input.field === "access") {
    if (!ADMIN_USER_ACCESS_OPTIONS.includes(value as (typeof ADMIN_USER_ACCESS_OPTIONS)[number])) {
      throw new Error(`"${value}" is not a valid access status.`);
    }

    await updateUserAsAdmin(input.recordId, { access: value as (typeof ADMIN_USER_ACCESS_OPTIONS)[number] });
    return;
  }

  await updateUserAsAdmin(input.recordId, { [input.field]: value });
}
