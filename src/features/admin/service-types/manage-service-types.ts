"use server";

import { auth } from "@clerk/nextjs/server";

import { createServiceType, getUserRole, updateServiceTypeName, type AdminServiceTypeRecord } from "@/lib/airtable";

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

export type UpdateServiceTypeNameInput = {
  recordId: string;
  name: string;
};

export async function updateServiceTypeNameAction(input: UpdateServiceTypeNameInput): Promise<void> {
  await requireAdmin();

  const name = input.name.trim();

  if (name === "") {
    throw new Error("Name can't be empty.");
  }

  await updateServiceTypeName(input.recordId, name);
}

export async function createServiceTypeAction(name: string): Promise<AdminServiceTypeRecord> {
  await requireAdmin();

  const trimmed = name.trim();

  if (trimmed === "") {
    throw new Error("Name can't be empty.");
  }

  return createServiceType(trimmed);
}
