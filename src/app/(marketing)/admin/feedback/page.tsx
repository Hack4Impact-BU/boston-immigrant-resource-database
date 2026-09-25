import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import FeedbackTable, { type FeedbackColumn } from "@/components/admin/FeedbackTable";
import { getAllFeedbackForAdmin, getTableSchema, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const TABLE_NAME = "User Support / Feedback";
const EXCLUDED_FIELDS = new Set(["ID", "Email Entered"]);
// "All the AI columns" — excluded by their actual Airtable field type (aiText),
// confirmed against the live schema, rather than by name. More robust than
// hard-coding each one, since it also covers any added later.
const EXCLUDED_FIELD_TYPES = new Set(["aiText"]);
const READ_ONLY_FIELDS = new Set([
  "Feedback Date",
  // The real field is named "Last Modified Date/Time", not "Last Modified Date"
  // as originally described — confirmed directly against the live schema.
  "Last Modified Date/Time",
  "Feedback Text",
  "Submitted By",
]);
// Forced to the multi-line textarea treatment by name, matching the Contact Us
// Requests pattern — both are confirmed multilineText already, so this is a
// defensive, belt-and-suspenders measure rather than a strictly necessary one.
const FORCE_TEXTAREA_FIELDS = new Set(["Feedback Text", "Admin Notes"]);

function widgetForFieldType(type: string): FeedbackColumn["widget"] {
  if (type === "singleSelect") return "select";
  if (type === "multipleSelects") return "multiSelectText";
  if (type === "checkbox") return "checkbox";
  if (type === "multilineText") return "textarea";
  if (type === "date" || type === "dateTime" || type === "createdTime" || type === "lastModifiedTime") return "date";
  return "text";
}

export default async function FeedbackPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only — same gating pattern as /admin/users and /admin/contact-requests.
  if (userRole !== "Admin") {
    notFound();
  }

  const [feedback, schema] = await Promise.all([
    getAllFeedbackForAdmin(),
    getTableSchema(TABLE_NAME),
  ]);

  // Column order and set come from the live schema, not a hard-coded list —
  // this table's fields aren't known at compile time. Excluded and read-only
  // fields are applied against what the schema actually returns.
  const columns: FeedbackColumn[] = schema
    .filter((field) => !EXCLUDED_FIELDS.has(field.name) && !EXCLUDED_FIELD_TYPES.has(field.type))
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
      <Sidebar isOpen={true} activePage="Support / Feedback" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage User Support/Feedback Requests</h1>
            <p className="mt-1 text-sm text-slate-600">
              {feedback.length} entr{feedback.length === 1 ? "y" : "ies"} in the User Support / Feedback table.
              Changes save automatically when you click away from a field.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <FeedbackTable feedback={feedback} columns={columns} />
          </div>
        </div>
      </main>
    </div>
  );
}
