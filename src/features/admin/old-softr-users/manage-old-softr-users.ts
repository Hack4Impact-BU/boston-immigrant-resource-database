"use server";

import { auth } from "@clerk/nextjs/server";

import { getUserRole, updateOldSoftrUserField } from "@/lib/airtable";

// Admin Notes is the only editable field on this table — enforced here as an
// allowlist (rather than a denylist of read-only fields, like the other admin
// tools use) since everything else on this table is read-only.
const EDITABLE_FIELDS = new Set(["Admin Notes"]);

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

export type UpdateOldSoftrUserFieldInput = {
  recordId: string;
  fieldName: string;
  value: string;
};

export async function updateOldSoftrUserFieldAction(input: UpdateOldSoftrUserFieldInput): Promise<void> {
  await requireAdmin();

  if (!EDITABLE_FIELDS.has(input.fieldName)) {
    throw new Error(`"${input.fieldName}" is not editable.`);
  }

  await updateOldSoftrUserField(input.recordId, input.fieldName, input.value.trim());
}
