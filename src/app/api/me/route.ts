import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserOrganizationName, getUserRole } from "@/lib/airtable";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ organizationName: null, userRole: null }, { status: 401 });
  }

  const [organizationName, userRole] = await Promise.all([getUserOrganizationName(userId), getUserRole(userId)]);

  return NextResponse.json({ organizationName, userRole });
}