import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import OldSoftrUsersTable, { type OldSoftrUserColumn } from "@/components/admin/OldSoftrUsersTable";
import { getAllOldSoftrUsersForAdmin, getTableSchema, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const TABLE_NAME = "Old Softr Users";
// Admin Notes is the only editable field on this table — everything else the
// live schema returns is shown, but read-only.
const EDITABLE_FIELDS = new Set(["Admin Notes"]);

function widgetForFieldType(type: string): OldSoftrUserColumn["widget"] {
  if (type === "singleSelect") return "select";
  if (type === "multilineText") return "textarea";
  return "text";
}

export default async function OldSoftrUsersPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only — same gating pattern as the other admin tools.
  if (userRole !== "Admin") {
    notFound();
  }

  const [oldSoftrUsers, schema] = await Promise.all([
    getAllOldSoftrUsersForAdmin(),
    getTableSchema(TABLE_NAME),
  ]);

  const columns: OldSoftrUserColumn[] = schema.map((field) => ({
    field: field.name,
    label: field.name,
    editable: EDITABLE_FIELDS.has(field.name),
    widget: widgetForFieldType(field.type),
    options: field.options,
    optionColors: field.optionColors,
  }));

  return (
    <div className="flex h-screen items-stretch overflow-hidden bg-slate-100">
      <Sidebar isOpen={true} activePage="Old Softr Users" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage Old Softr Users</h1>
            <p className="mt-1 text-sm text-slate-600">
              {oldSoftrUsers.length} legacy user{oldSoftrUsers.length === 1 ? "" : "s"} migrated from Softr.
              Admin Notes save automatically when you click away from the field.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <OldSoftrUsersTable users={oldSoftrUsers} columns={columns} />
          </div>
        </div>
      </main>
    </div>
  );
}
