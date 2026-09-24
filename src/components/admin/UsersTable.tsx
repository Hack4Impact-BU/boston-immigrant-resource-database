"use client";

import { useEffect, useMemo, useState } from "react";

import { updateUserFieldAction } from "@/features/admin/users/manage-users";
import type { AdminUserRecord, FieldOptionColors, UpdateUserAsAdminInput } from "@/lib/airtable";

type EditableField = keyof UpdateUserAsAdminInput;
type ColumnField = EditableField | "clerkUserId" | "providerId" | "createdTime";
type SaveState = "idle" | "saving" | "saved" | "error";

const ROLE_OPTIONS = ["Admin", "Provider", "Viewer"] as const;
const ACCESS_OPTIONS = ["approved", "pending", "rejected"] as const;

// Order matches what's asked: Role/Access moved to sit right after Last Name.
const COLUMNS: { field: ColumnField; label: string; editable: boolean }[] = [
  { field: "createdTime", label: "Created", editable: false },
  { field: "email", label: "Email", editable: true },
  { field: "firstName", label: "First Name", editable: true },
  { field: "lastName", label: "Last Name", editable: true },
  { field: "userRole", label: "Role", editable: true },
  { field: "access", label: "Access", editable: true },
  { field: "organizationName", label: "Organization", editable: true },
  { field: "phoneNumber", label: "Phone Number", editable: true },
  { field: "website", label: "Website", editable: true },
  { field: "clerkUserId", label: "Clerk User ID", editable: false },
  { field: "providerId", label: "Provider ID", editable: false },
];

const MIN_COLUMN_WIDTH = 70;
// Fixed widths that override the normal auto-shrink-to-content sizing below —
// used when one outlier value would otherwise stretch a column unreasonably
// wide. website: one real URL in this data needs ~847px including padding to
// display in full; 560px is roughly 2/3 of that, so most values still fit
// comfortably while that one outlier truncates instead of dominating the layout.
const FIXED_INITIAL_WIDTHS: Partial<Record<ColumnField, number>> = {
  website: 560,
};
// The input/select itself reserves px-2 (8px) + pr-14 (56px, for the save
// indicator text) = 64px before any text even starts, plus the table cell's own
// px-1 (8px), plus room for a select's native dropdown arrow and some genuine
// breathing room so text doesn't sit flush against the edges.
const CELL_HORIZONTAL_PADDING = 112;
const FALLBACK_CHAR_WIDTH = 7.5; // used only before the client can measure with canvas

function formatCreatedTime(isoString: string): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getDisplayValue(user: AdminUserRecord, field: ColumnField): string {
  if (field === "createdTime") return formatCreatedTime(user.createdTime);
  return user[field] ?? "";
}

// Simple relative-luminance check so text stays readable against both Airtable's
// light option colors (e.g. blueLight2) and its bright/dark ones (e.g. purpleDark1).
function getReadableTextColor(rgbString: string): string {
  const match = rgbString.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#1e293b";
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}

let measureCanvasContext: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") {
    return text.length * FALLBACK_CHAR_WIDTH;
  }

  if (!measureCanvasContext) {
    const canvas = document.createElement("canvas");
    measureCanvasContext = canvas.getContext("2d");
  }

  if (!measureCanvasContext) {
    return text.length * FALLBACK_CHAR_WIDTH;
  }

  measureCanvasContext.font = font;
  return measureCanvasContext.measureText(text).width;
}

// SSR-safe estimate using a flat per-character width — good enough for the very
// first paint. Replaced by the precise canvas-measured version once mounted.
function computeEstimatedWidths(users: AdminUserRecord[]): Record<ColumnField, number> {
  const widths = {} as Record<ColumnField, number>;

  for (const column of COLUMNS) {
    if (FIXED_INITIAL_WIDTHS[column.field] !== undefined) {
      widths[column.field] = FIXED_INITIAL_WIDTHS[column.field]!;
      continue;
    }

    const longest = Math.max(
      column.label.length,
      ...users.map((user) => getDisplayValue(user, column.field).length),
    );
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, longest * FALLBACK_CHAR_WIDTH + CELL_HORIZONTAL_PADDING);
  }

  return widths;
}

function computeMeasuredWidths(users: AdminUserRecord[]): Record<ColumnField, number> {
  const headerFont = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const cellFont = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const widths = {} as Record<ColumnField, number>;

  for (const column of COLUMNS) {
    if (FIXED_INITIAL_WIDTHS[column.field] !== undefined) {
      widths[column.field] = FIXED_INITIAL_WIDTHS[column.field]!;
      continue;
    }

    const headerWidth = measureTextWidth(column.label, headerFont);
    const longestCellWidth = Math.max(
      0,
      ...users.map((user) => measureTextWidth(getDisplayValue(user, column.field), cellFont)),
    );
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, Math.max(headerWidth, longestCellWidth) + CELL_HORIZONTAL_PADDING);
  }

  return widths;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Saving…</span>;
  }
  if (state === "saved") {
    return <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600">Saved</span>;
  }
  if (state === "error") {
    return <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-rose-600">Not saved</span>;
  }
  return null;
}

function EditableTextCell({ recordId, field, initialValue }: { recordId: string; field: EditableField; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleBlur() {
    const trimmed = value.trim();
    if (trimmed === lastSaved) return;

    setSaveState("saving");
    try {
      await updateUserFieldAction({ recordId, field, value: trimmed });
      setValue(trimmed);
      setLastSaved(trimmed);
      setSaveState("saved");
    } catch (error) {
      console.error(error);
      setValue(lastSaved);
      setSaveState("error");
    }
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
        onFocus={() => setSaveState("idle")}
        title={value}
        className="w-full truncate rounded-md border border-transparent bg-transparent px-2 py-1.5 pr-14 text-sm text-slate-700 outline-none transition-colors hover:border-slate-200 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-200"
      />
      <SaveIndicator state={saveState} />
    </div>
  );
}

function EditableSelectCell({
  recordId,
  field,
  initialValue,
  options,
  optionColors,
  allowBlank,
}: {
  recordId: string;
  field: EditableField;
  initialValue: string;
  options: readonly string[];
  optionColors: FieldOptionColors;
  allowBlank?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleChange(newValue: string) {
    const previousValue = value;
    setValue(newValue);
    setSaveState("saving");

    try {
      await updateUserFieldAction({ recordId, field, value: newValue });
      setSaveState("saved");
    } catch (error) {
      console.error(error);
      setValue(previousValue);
      setSaveState("error");
    }
  }

  const backgroundColor = optionColors[value];
  const textColor = backgroundColor ? getReadableTextColor(backgroundColor) : undefined;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        style={backgroundColor ? { backgroundColor, color: textColor } : undefined}
        title={value}
        className="w-full cursor-pointer truncate rounded-md border border-transparent px-2 py-1.5 pr-14 text-sm font-medium outline-none transition-colors hover:border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
      >
        {allowBlank ? <option value="">— (none)</option> : null}
        {options.map((option) => (
          <option
            key={option}
            value={option}
            style={optionColors[option] ? { backgroundColor: optionColors[option], color: getReadableTextColor(optionColors[option]) } : undefined}
          >
            {option}
          </option>
        ))}
      </select>
      <SaveIndicator state={saveState} />
    </div>
  );
}

export default function UsersTable({
  users,
  fieldColors,
}: {
  users: AdminUserRecord[];
  fieldColors: Record<string, FieldOptionColors>;
}) {
  const [columnWidths, setColumnWidths] = useState<Record<ColumnField, number>>(() => computeEstimatedWidths(users));
  const [sort, setSort] = useState<{ field: ColumnField; direction: "asc" | "desc" } | null>({
    field: "createdTime",
    direction: "desc",
  });
  const [resizingField, setResizingField] = useState<ColumnField | null>(null);
  const [searchText, setSearchText] = useState("");

  // Upgrade from the SSR-safe character estimate to precise canvas-measured
  // widths once mounted — canvas isn't available during server rendering.
  useEffect(() => {
    setColumnWidths(computeMeasuredWidths(users));
    // Only recompute when the underlying data changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const searchedUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.email, user.firstName, user.lastName, user.organizationName, user.website].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [users, searchText]);

  const sortedUsers = useMemo(() => {
    if (!sort) return searchedUsers;

    const withValues = searchedUsers.map((user) => ({
      user,
      value: sort.field === "createdTime" ? new Date(user.createdTime).getTime() || 0 : getDisplayValue(user, sort.field).toLowerCase(),
    }));

    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.direction === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return withValues.map((entry) => entry.user);
  }, [searchedUsers, sort]);

  function handleSortClick(field: ColumnField) {
    setSort((current) => {
      if (!current || current.field !== field) return { field, direction: "asc" };
      if (current.direction === "asc") return { field, direction: "desc" };
      return null;
    });
  }

  function handleResizeStart(event: React.MouseEvent, field: ColumnField) {
    event.preventDefault();
    event.stopPropagation(); // don't also trigger the header's sort click
    setResizingField(field);

    const startX = event.clientX;
    const startWidth = columnWidths[field];

    function handleMouseMove(moveEvent: MouseEvent) {
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + (moveEvent.clientX - startX));
      setColumnWidths((previous) => ({ ...previous, [field]: nextWidth }));
    }

    function handleMouseUp() {
      setResizingField(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <input
        type="text"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search by email, first name, last name, organization, or website…"
        className="w-full shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="border-collapse text-left" style={{ tableLayout: "fixed", width: "max-content" }}>
          <colgroup>
            {COLUMNS.map((column) => (
              <col key={column.field} style={{ width: columnWidths[column.field] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {COLUMNS.map((column) => {
                const isSorted = sort?.field === column.field;

              return (
                <th key={column.field} className="sticky top-0 z-10 relative select-none bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortClick(column.field)}
                    className="flex w-full cursor-pointer items-center gap-1 truncate text-left hover:text-slate-700"
                    title={`Sort by ${column.label}`}
                  >
                    <span className="truncate">{column.label}</span>
                    <span className="shrink-0 text-slate-300">{isSorted ? (sort.direction === "asc" ? "▲" : "▼") : "⇅"}</span>
                  </button>
                  {!column.editable ? (
                    <span className="mt-0.5 block font-normal normal-case text-slate-400">read-only</span>
                  ) : null}

                  {/* Drag handle: resizes this column without triggering the sort click above */}
                  <div
                    onMouseDown={(event) => handleResizeStart(event, column.field)}
                    className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none ${
                      resizingField === column.field ? "bg-sky-300" : "hover:bg-sky-200"
                    }`}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
              <td title={formatCreatedTime(user.createdTime)} className="overflow-hidden truncate px-3 py-1.5 text-sm text-slate-400">{formatCreatedTime(user.createdTime)}</td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="email" initialValue={user.email} />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="firstName" initialValue={user.firstName} />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="lastName" initialValue={user.lastName} />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableSelectCell
                  recordId={user.id}
                  field="userRole"
                  initialValue={user.userRole}
                  options={ROLE_OPTIONS}
                  optionColors={fieldColors.userRole ?? {}}
                  allowBlank
                />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableSelectCell
                  recordId={user.id}
                  field="access"
                  initialValue={user.access}
                  options={ACCESS_OPTIONS}
                  optionColors={fieldColors.access ?? {}}
                />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="organizationName" initialValue={user.organizationName} />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="phoneNumber" initialValue={user.phoneNumber} />
              </td>
              <td className="overflow-hidden px-1 py-1">
                <EditableTextCell recordId={user.id} field="website" initialValue={user.website} />
              </td>
              <td title={user.clerkUserId} className="overflow-hidden truncate px-3 py-1.5 text-sm text-slate-400">{user.clerkUserId || "—"}</td>
              <td title={user.providerId} className="overflow-hidden truncate px-3 py-1.5 text-sm text-slate-400">{user.providerId || "—"}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
