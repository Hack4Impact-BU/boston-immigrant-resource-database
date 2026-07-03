"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

import { requireNonEmptyString } from "@/features/auth/auth-helpers";
import { createUser } from "@/lib/airtable";

export type SaveRegisteredUserInput = {
  clerkUserId?: string | null;
  organizationName: string;
  website: string;
  phoneNumber: string;
  email: string;
};

function getPrimaryEmail(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  return user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  )?.emailAddress;
}

export async function saveRegisteredUser(input: SaveRegisteredUserInput) {
  const requestedClerkUserId = input.clerkUserId?.trim();
  const { userId: authenticatedUserId } = await auth();

  if (authenticatedUserId && requestedClerkUserId && authenticatedUserId !== requestedClerkUserId) {
    throw new Error("You cannot save registration details for another user.");
  }

  const client = await clerkClient();
  const clerkUser = requestedClerkUserId
    ? await client.users.getUser(requestedClerkUserId)
    : (
        await client.users.getUserList({
          emailAddress: [input.email],
          limit: 1,
          orderBy: "-created_at",
        })
      ).data[0];

  if (!clerkUser) {
    throw new Error("Registration rollback could not find the Clerk account.");
  }

  const primaryEmail = getPrimaryEmail(clerkUser);
  const isRecentSignUp = Date.now() - clerkUser.createdAt < 10 * 60 * 1000;

  if (primaryEmail?.toLowerCase() !== input.email.toLowerCase() || !isRecentSignUp) {
    throw new Error("Registration rollback could not verify the Clerk account.");
  }

  const clerkUserId = clerkUser.id;

  try {
    await createUser({
      clerkUserId,
      organizationName: requireNonEmptyString(input.organizationName, "organizationName"),
      website: requireNonEmptyString(input.website, "website"),
      phoneNumber: requireNonEmptyString(input.phoneNumber, "phoneNumber"),
      email: requireNonEmptyString(input.email, "email"),
    });
  } catch {
    try {
      await client.users.deleteUser(clerkUserId);
    } catch {
      throw new Error("Registration failed, but the Clerk account could not be deleted.");
    }

    throw new Error("Registration could not be completed. Please try again.");
  }
}
