"use client";

import { useEffect, useMemo, useState } from "react";

import { updateOldSoftrUserFieldAction } from "@/features/admin/old-softr-users/manage-old-softr-users";

type FieldOptionColors = Record<string, string>;

export type OldSoftrUserColumn = {
  field: string;
  label: string;
  editable: boolean;
  widget: "text" | "select" | "textarea";
  options: readonly string[];
  optionColors: FieldOptionColors;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const MIN_COLUMN_WIDTH = 70;
// Same reasoning as the other admin tables: an editable input reserves px-2
// (8px) + pr-14 (56px, for the save indicator) = 64px before any text even
// starts, plus the cell's own padding. Read-only cells are a plain div with
// just px-3 (12px/side), so they need far less.
const CELL_HORIZONTAL_PADDING = 112;
const READONLY_CELL_HORIZONTAL_PADDING = 40;
const FALLBACK_CHAR_WIDTH = 7.5;
// Multi-line text columns wrap across several lines rather than needing to
// fit on one — measuring against the longest single line would defeat the
// point, so they get a fixed, modest width instead.
const MULTILINE_COLUMN_WIDTH = 480;
const SEARCHABLE_FIELDS = ["Email", "First Name", "Last Name"];
const FILTERABLE_FIELDS = ["userRole", "Last Softr Status", "Status"];

function toDisplayString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => toDisplayString(entry)).join(", ");
  return "";
}

function getDisplayValue(user: { fields: Record<string, unknown> }, column: OldSoftrUserColumn): string {
  return toDisplayString(user.fields[column.field]);
}

function paddingForColumn(column: OldSoftrUserColumn): number {
  return column.editable ? CELL_HORIZONTAL_PADDING : READONLY_CELL_HORIZONTAL_PADDING;
}

function computeEstimatedWidths(
  users: { fields: Record<string, unknown> }[],
  columns: OldSoftrUserColumn[],
): Record<string, number> {
  const widths: Record<string, number> = {};
  for (const column of columns) {
    if (column.widget === "textarea") {
      widths[column.field] = MULTILINE_COLUMN_WIDTH;
      continue;
    }
    const longest = Math.max(column.label.length, ...users.map((u) => getDisplayValue(u, column).length));
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, longest * FALLBACK_CHAR_WIDTH + paddingForColumn(column));
  }
  return widths;
}

let measureCanvasContext: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * FALLBACK_CHAR_WIDTH;
  if (!measureCanvasContext) {
    measureCanvasContext = document.createElement("canvas").getContext("2d");
  }
  if (!measureCanvasContext) return text.length * FALLBACK_CHAR_WIDTH;
  measureCanvasContext.font = font;
  return measureCanvasContext.measureText(text).width;
}

function computeMeasuredWidths(
  users: { fields: Record<string, unknown> }[],
  columns: OldSoftrUserColumn[],
): Record<string, number> {
  const headerFont = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const cellFont = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const widths: Record<string, number> = {};
  for (const column of columns) {
    if (column.widget === "textarea") {
      widths[column.field] = MULTILINE_COLUMN_WIDTH;
      continue;
    }
    const headerWidth = measureTextWidth(column.label, headerFont);
    const longestCellWidth = Math.max(0, ...users.map((u) => measureTextWidth(getDisplayValue(u, column), cellFont)));
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, Math.max(headerWidth, longestCellWidth) + paddingForColumn(column));
  }
  return widths;
}

function getReadableTextColor(rgbString: string): string {
  const match = rgbString.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#1e293b";
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
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

function EditableTextCell({
  recordId,
  fieldName,
  initialValue,
  multiline,
}: {
  recordId: string;
  fieldName: string;
  initialValue: string;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleBlur() {
    if (value === lastSaved) return;
    setSaveState("saving");
    try {
      await updateOldSoftrUserFieldAction({ recordId, fieldName, value });
      setLastSaved(value);
      setSaveState("saved");
    } catch (error) {
      console.error(error);
      setValue(lastSaved);
      setSaveState("error");
    }
  }

  const lineCount = Math.max(1, value.split("\n").length);

  if (multiline) {
    return (
      <div className="relative h-full">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={handleBlur}
          onFocus={() => setSaveState("idle")}
          rows={lineCount}
          title={value}
          className="h-full w-full resize-none overflow-y-auto whitespace-normal rounded-md border border-transparent bg-transparent px-2 py-1.5 pr-14 text-sm text-slate-700 outline-none transition-colors hover:border-slate-200 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-200"
        />
        <SaveIndicator state={saveState} />
      </div>
    );
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

function ReadOnlyCell({ value }: { value: string }) {
  return (
    <div title={value} className="truncate px-3 py-1.5 text-sm text-slate-500">
      {value || "—"}
    </div>
  );
}

// A read-only, but still color-coded, Single Select value — a static pill
// rather than a <select>, since userRole / Last Softr Status / Status are all
// read-only on this table (unlike every other admin tool, where a colored
// Single Select is also the editable one).
function ReadOnlySelectCell({ value, color }: { value: string; color?: string }) {
  if (!value) return <div className="px-3 py-1.5 text-sm text-slate-500">—</div>;
  if (!color) return <ReadOnlyCell value={value} />;

  return (
    <div className="px-2 py-1">
      <span
        title={value}
        style={{ backgroundColor: color, color: getReadableTextColor(color) }}
        className="inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        {value}
      </span>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  optionColors,
  selected,
  onChange,
  isOpen,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  optionColors: FieldOptionColors;
  selected: string[];
  onChange: (values: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  function toggleOption(option: string) {
    onChange(selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option]);
  }

  const buttonLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`;

  return (
    <div className="relative" data-filter-dropdown-root>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${
          selected.length === 0 ? "border-slate-200 bg-white text-slate-700" : "border-sky-200 bg-sky-50 text-sky-800"
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="shrink-0 text-slate-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-sky-700 underline decoration-sky-300 hover:text-sky-800 cursor-pointer"
              >
                Clear All
              </button>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {options.map((option) => {
              const isActive = selected.includes(option);
              const color = optionColors[option];
              return (
                <label
                  key={option}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isActive && !color ? "bg-sky-50 text-sky-800" : !color ? "text-slate-700 hover:bg-slate-50" : "hover:bg-slate-50"
                  }`}
                >
                  <input type="checkbox" checked={isActive} onChange={() => toggleOption(option)} className="h-4 w-4 shrink-0 cursor-pointer" />
                  {color ? (
                    <span
                      style={{ backgroundColor: color, color: getReadableTextColor(color) }}
                      className="truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {option}
                    </span>
                  ) : (
                    <span className="truncate">{option}</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function OldSoftrUsersTable({
  users,
  columns,
}: {
  users: { id: string; fields: Record<string, unknown> }[];
  columns: OldSoftrUserColumn[];
}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => computeEstimatedWidths(users, columns));
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>({ field: "Email", direction: "asc" });
  const [resizingField, setResizingField] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [openFilterField, setOpenFilterField] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-filter-dropdown-root]")) {
        setOpenFilterField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useState(() => {
    // Runs once on mount, after the DOM (and canvas measurement) is available.
    if (typeof document !== "undefined") {
      setColumnWidths(computeMeasuredWidths(users, columns));
    }
  });

  const filteredUsers = useMemo(() => {
    const activeEntries = Object.entries(activeFilters).filter(([, values]) => values.length > 0);
    if (activeEntries.length === 0) return users;

    return users.filter((user) =>
      activeEntries.every(([field, values]) => values.includes(toDisplayString(user.fields[field]))),
    );
  }, [users, activeFilters]);

  const searchedUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return filteredUsers;
    const searchableColumns = columns.filter((column) => SEARCHABLE_FIELDS.includes(column.field));
    return filteredUsers.filter((user) => searchableColumns.some((column) => getDisplayValue(user, column).toLowerCase().includes(query)));
  }, [filteredUsers, columns, searchText]);

  const sortedUsers = useMemo(() => {
    if (!sort) return searchedUsers;
    const column = columns.find((c) => c.field === sort.field);
    if (!column) return searchedUsers;

    const withValues = searchedUsers.map((user) => ({ user, value: getDisplayValue(user, column).toLowerCase() }));
    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.direction === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return withValues.map((entry) => entry.user);
  }, [searchedUsers, sort, columns]);

  function handleSortClick(field: string) {
    setSort((current) => {
      if (!current || current.field !== field) return { field, direction: "asc" };
      if (current.direction === "asc") return { field, direction: "desc" };
      return null;
    });
  }

  function handleResizeStart(event: React.MouseEvent, field: string) {
    event.preventDefault();
    event.stopPropagation();
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
      <div className="relative shrink-0">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by Email, First Name, or Last Name…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 pr-9 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
        />
        {searchText.length > 0 ? (
          <button
            type="button"
            onClick={() => setSearchText("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {FILTERABLE_FIELDS.map((fieldName) => {
          const column = columns.find((c) => c.field === fieldName);
          if (!column) return null; // this field doesn't exist in the live schema

          return (
            <FilterDropdown
              key={fieldName}
              label={fieldName}
              options={column.options}
              optionColors={column.optionColors}
              selected={activeFilters[fieldName] ?? []}
              onChange={(values) => setActiveFilters((previous) => ({ ...previous, [fieldName]: values }))}
              isOpen={openFilterField === fieldName}
              onToggle={() => setOpenFilterField((current) => (current === fieldName ? null : fieldName))}
            />
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="border-collapse text-left" style={{ tableLayout: "fixed", width: "max-content" }}>
          <colgroup>
            {columns.map((column) => (
              <col key={column.field} style={{ width: columnWidths[column.field] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => {
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
                {columns.map((column) => {
                  const rawValue = getDisplayValue(user, column);

                  if (column.editable) {
                    return (
                      <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                        <EditableTextCell
                          recordId={user.id}
                          fieldName={column.field}
                          initialValue={rawValue}
                          multiline={column.widget === "textarea"}
                        />
                      </td>
                    );
                  }

                  if (column.widget === "select") {
                    return (
                      <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                        <ReadOnlySelectCell value={rawValue} color={column.optionColors[rawValue]} />
                      </td>
                    );
                  }

                  return (
                    <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                      <ReadOnlyCell value={rawValue} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
