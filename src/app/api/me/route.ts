import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserOrganizationName } from "@/lib/airtable";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ organizationName: null }, { status: 401 });
  }

  const organizationName = await getUserOrganizationName(userId);

  return NextResponse.json({ organizationName });
}