import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import MouResponsesTable, { type MouColumn } from "@/components/admin/MouResponsesTable";
import { fetchPublicSheetAsCsv, findHeaderByPrefix, parseSheetCsv } from "@/lib/googleSheets";
import { getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const MOU_SHEET_ID = "1r8qq57tQUewDDBwivRszzOJG5aYpfXSwHimy-MoG-sU";

// Each column is matched against the sheet's real headers by this prefix
// (see findHeaderByPrefix) rather than the full header text, since several of
// the real headers contain embedded multi-line question text / instructions
// whose exact whitespace can drift or vary from what's visible when just
// reading the sheet in a browser.
const COLUMN_DEFINITIONS: {
  prefix: string;
  label: string;
  multiline?: boolean;
  isDate?: boolean;
  isFilterable?: boolean;
  isMultiSelect?: boolean;
}[] = [
  { prefix: "Timestamp", label: "Timestamp", isDate: true },
  { prefix: "Primary Contact Name", label: "Primary Contact Name" },
  { prefix: "Primary Contact Title/Role", label: "Primary Contact Title/Role" },
  { prefix: "Email Address for Log In", label: "Email Address for Log In" },
  { prefix: "Organization Name", label: "Organization Name" },
  { prefix: "Organization Phone", label: "Organization Phone" },
  { prefix: "Backup contact name & email", label: "Backup Contact Name & Email" },
  { prefix: "What resources will you list on BIRD", label: "What resources will you list on BIRD (or search for)", multiline: true },
  {
    prefix: "Which of the following best describes how you will use BIRD",
    label: "Which of the following best describes how you will use BIRD",
    isFilterable: true,
  },
  {
    prefix: "How should we remind you to update your service information",
    label: "How should we remind you to update your service information?",
    // A "Check all that apply" question — each cell is a comma-joined list of
    // whatever the respondent checked, not one atomic value.
    isFilterable: true,
    isMultiSelect: true,
  },
  { prefix: "Do you have any other questions, comments or feedback", label: "Do you have any other questions, comments, or feedback" },
];

export default async function MouResponsesPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only — same gating pattern as the other admin tools.
  if (userRole !== "Admin") {
    notFound();
  }

  const csvText = await fetchPublicSheetAsCsv(MOU_SHEET_ID);
  const { rows, headers } = parseSheetCsv(csvText);

  // Resolve each column definition's prefix to the sheet's actual, current
  // header string. A column is silently skipped if its prefix no longer
  // matches anything (e.g. the question was reworded or removed in the form)
  // rather than crashing the whole page over one missing column.
  const columns: MouColumn[] = COLUMN_DEFINITIONS.flatMap((definition) => {
    const realHeader = findHeaderByPrefix(headers, definition.prefix);
    if (!realHeader) return [];
    return [
      {
        field: realHeader,
        label: definition.label,
        multiline: definition.multiline ?? false,
        isDate: definition.isDate ?? false,
        isFilterable: definition.isFilterable ?? false,
        isMultiSelect: definition.isMultiSelect ?? false,
      },
    ];
  });

  const timestampColumn = columns.find((column) => column.isDate);
  const defaultSort = timestampColumn ? { field: timestampColumn.field, direction: "desc" as const } : undefined;

  return (
    <div className="flex h-screen items-stretch overflow-hidden bg-slate-100">
      <Sidebar isOpen={true} activePage="MOU Responses" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">MOU Responses</h1>
            <p className="mt-1 text-sm text-slate-600">
              {rows.length} response{rows.length === 1 ? "" : "s"} from the BIRD MOU Google Form, read live from this{" "}
              <a
                href={`https://docs.google.com/spreadsheets/d/${MOU_SHEET_ID}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 underline decoration-sky-300 hover:text-sky-800"
              >
                Sheet
              </a>
              . This view is read-only.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <MouResponsesTable rows={rows} columns={columns} defaultSort={defaultSort} />
          </div>
        </div>
      </main>
    </div>
  );
}
