"use server";

import { auth } from "@clerk/nextjs/server";

import { getTableSchema, getUserRole, updateFeedbackField } from "@/lib/airtable";

const TABLE_NAME = "User Support / Feedback";

// Enforced here too, not just hidden in the UI — a Server Action is reachable
// directly, so the read-only list needs to hold even if someone bypasses the form.
// Note: the real Airtable field is named "Last Modified Date/Time", not "Last
// Modified Date" — confirmed directly against the live schema.
const READ_ONLY_FIELDS = new Set([
  "Feedback Date",
  "Last Modified Date/Time",
  "Feedback Text",
  "Submitted By",
]);

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

export type UpdateFeedbackFieldInput = {
  recordId: string;
  fieldName: string;
  value: string;
};

export async function updateFeedbackFieldAction(input: UpdateFeedbackFieldInput): Promise<void> {
  await requireAdmin();

  if (READ_ONLY_FIELDS.has(input.fieldName)) {
    throw new Error(`"${input.fieldName}" is not editable.`);
  }

  const value = input.value.trim();

  // Re-fetch the live schema rather than trust whatever the client claims the
  // valid options are — this table's fields (and their Single Select options)
  // aren't hard-coded, so this is the actual source of truth for validation.
  const schema = await getTableSchema(TABLE_NAME);
  const field = schema.find((f) => f.name === input.fieldName);

  if (field && field.type === "singleSelect" && value !== "" && !field.options.includes(value)) {
    throw new Error(`"${value}" is not a valid option for "${input.fieldName}".`);
  }

  await updateFeedbackField(input.recordId, input.fieldName, value === "" ? null : value);
}
