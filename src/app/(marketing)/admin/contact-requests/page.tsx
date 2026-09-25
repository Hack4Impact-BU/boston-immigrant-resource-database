import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import ContactRequestsTable, { type ContactRequestColumn } from "@/components/admin/ContactRequestsTable";
import { getAllContactUsRequestsForAdmin, getTableSchema, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const TABLE_NAME = "Contact Us Requests";
const EXCLUDED_FIELDS = new Set(["AI Message Summary", "ID"]);
const READ_ONLY_FIELDS = new Set([
  "Request Date",
  "Last Modified",
  "Message",
  "Organization",
  "First Name",
  "Last Name",
  "Primary Reason For Contact",
  "Preferred Method of Contact",
  "Email",
  "Phone",
]);
// Forced to the multi-line textarea treatment by name, regardless of their
// detected Airtable type — more robust than relying purely on type detection
// against a live schema I can't directly verify myself.
const FORCE_TEXTAREA_FIELDS = new Set(["Message", "Admin Notes"]);

function widgetForFieldType(type: string): ContactRequestColumn["widget"] {
  if (type === "singleSelect") return "select";
  if (type === "multipleSelects") return "multiSelectText";
  if (type === "checkbox") return "checkbox";
  if (type === "multilineText") return "textarea";
  if (type === "date" || type === "dateTime" || type === "createdTime" || type === "lastModifiedTime") return "date";
  return "text";
}

export default async function ManageContactRequestsPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only — same gating pattern as /admin/users.
  if (userRole !== "Admin") {
    notFound();
  }

  const [requests, schema] = await Promise.all([
    getAllContactUsRequestsForAdmin(),
    getTableSchema(TABLE_NAME),
  ]);

  // Column order and set come from the live schema, not a hard-coded list —
  // this table's fields aren't known at compile time. Excluded and read-only
  // fields are applied by name against what the schema actually returns.
  const columns: ContactRequestColumn[] = schema
    .filter((field) => !EXCLUDED_FIELDS.has(field.name))
    .map((field) => ({
      field: field.name,
      label: field.name,
      editable: !READ_ONLY_FIELDS.has(field.name),
      widget: FORCE_TEXTAREA_FIELDS.has(field.name) ? "textarea" : widgetForFieldType(field.type),
      options: field.options,
      optionColors: field.optionColors,
    }));

  return (
    <div className="flex h-screen items-stretch overflow-hidden bg-slate-100">
      <Sidebar isOpen={true} activePage="Contact Us" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage Contact Us Requests</h1>
            <p className="mt-1 text-sm text-slate-600">
              {requests.length} request{requests.length === 1 ? "" : "s"} in the Contact Us Requests table. Changes
              save automatically when you click away from a field.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <ContactRequestsTable requests={requests} columns={columns} />
          </div>
        </div>
      </main>
    </div>
  );
}
