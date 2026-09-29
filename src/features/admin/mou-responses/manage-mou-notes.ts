"use server";

import { auth } from "@clerk/nextjs/server";

import { getUserRole, upsertMouNote } from "@/lib/airtable";

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

export type UpdateMouNoteInput = {
  timestamp: string;
  organizationName: string;
  notes: string;
};

export async function updateMouNoteAction(input: UpdateMouNoteInput): Promise<void> {
  await requireAdmin();
  await upsertMouNote(input.timestamp, input.organizationName, input.notes);
}
