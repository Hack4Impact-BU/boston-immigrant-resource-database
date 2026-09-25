import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import UsersTable from "@/components/admin/UsersTable";
import { getAllUsersForAdmin, getUserFieldOptionColors, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function ManageUsersPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only: this edits every account's role and access status directly, which
  // only makes sense as an Admin action — same gating pattern as /providers/new.
  if (userRole !== "Admin") {
    notFound();
  }

  const [users, fieldColors] = await Promise.all([
    getAllUsersForAdmin(),
    getUserFieldOptionColors(["userRole", "access"]),
  ]);

  return (
    <div className="flex h-screen items-stretch overflow-hidden bg-slate-100">
      <Sidebar isOpen={true} activePage="Users" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage Users</h1>
            <p className="mt-1 text-sm text-slate-600">
              {users.length} account{users.length === 1 ? "" : "s"} in the User table. Changes save automatically
              when you click away from a field.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <UsersTable users={users} fieldColors={fieldColors} />
          </div>
        </div>
      </main>
    </div>
  );
}
