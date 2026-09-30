"use client";

import { useEffect, useMemo, useState } from "react";

import { updateMouNoteAction } from "@/features/admin/mou-responses/manage-mou-notes";

export type MouColumn = {
  field: string;
  label: string;
  multiline: boolean;
  isDate?: boolean;
  isFilterable?: boolean;
  isMultiSelect?: boolean;
  isEditable?: boolean;
};

/**
 * Splits a "Check all that apply"-style cell value into its individual,
 * checked options. This sheet has no schema at all (unlike the Airtable admin
 * tools), so there's no predefined option list to split against — the form
 * itself joins checked options with ", " when Google Forms writes them to the
 * Sheet, so that's what's split on here, trimming the whitespace each split
 * leaves on every piece after the first.
 */
function splitMultiSelectValue(value: string): string[] {
  return value
    .split(",")
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0);
}

const MIN_COLUMN_WIDTH = 70;
const CELL_HORIZONTAL_PADDING = 40;
const FALLBACK_CHAR_WIDTH = 7.5;
// Multi-line text wraps across several lines rather than needing to fit on
// one — measuring against the longest single line would defeat the point of
// keeping this column a reasonable width.
const MULTILINE_COLUMN_WIDTH = 420;

function getDisplayValue(row: Record<string, string>, column: MouColumn): string {
  return row[column.field] ?? "";
}

function computeEstimatedWidths(rows: Record<string, string>[], columns: MouColumn[]): Record<string, number> {
  const widths: Record<string, number> = {};
  for (const column of columns) {
    if (column.multiline) {
      widths[column.field] = MULTILINE_COLUMN_WIDTH;
      continue;
    }
    const longest = Math.max(column.label.length, ...rows.map((row) => getDisplayValue(row, column).length));
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, longest * FALLBACK_CHAR_WIDTH + CELL_HORIZONTAL_PADDING);
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

function computeMeasuredWidths(rows: Record<string, string>[], columns: MouColumn[]): Record<string, number> {
  const headerFont = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const cellFont = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const widths: Record<string, number> = {};
  for (const column of columns) {
    if (column.multiline) {
      widths[column.field] = MULTILINE_COLUMN_WIDTH;
      continue;
    }
    const headerWidth = measureTextWidth(column.label, headerFont);
    const longestCellWidth = Math.max(0, ...rows.map((row) => measureTextWidth(getDisplayValue(row, column), cellFont)));
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, Math.max(headerWidth, longestCellWidth) + CELL_HORIZONTAL_PADDING);
  }
  return widths;
}

type SaveState = "idle" | "saving" | "saved" | "error";

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

// The one editable field on this page — Admin Notes, backed by a separate
// Airtable table (MOU Response Notes) keyed by this row's Timestamp, since
// the Sheet itself is read-only, unauthenticated public access.
function EditableAdminNotesCell({ timestamp, organizationName, initialValue }: { timestamp: string; organizationName: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleBlur() {
    if (value === lastSaved) return;
    setSaveState("saving");
    try {
      await updateMouNoteAction({ timestamp, organizationName, notes: value });
      setLastSaved(value);
      setSaveState("saved");
    } catch (error) {
      console.error(error);
      setValue(lastSaved);
      setSaveState("error");
    }
  }

  const lineCount = Math.max(1, value.split("\n").length);

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

function ReadOnlyCell({ value, multiline }: { value: string; multiline?: boolean }) {
  if (multiline) {
    return <div title={value} className="whitespace-pre-wrap break-words px-3 py-1.5 text-sm text-slate-500">{value || "—"}</div>;
  }
  return <div title={value} className="truncate px-3 py-1.5 text-sm text-slate-500">{value || "—"}</div>;
}

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  isOpen,
  onToggle,
}: {
  label: string;
  options: readonly string[];
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
        className={`inline-flex max-w-64 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${
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
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No options found.</p>
            ) : (
              options.map((option) => {
                const isActive = selected.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input type="checkbox" checked={isActive} onChange={() => toggleOption(option)} className="h-4 w-4 shrink-0 cursor-pointer" />
                    <span className="truncate">{option}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MouResponsesTable({
  rows,
  columns,
  defaultSort,
  timestampField,
  organizationField,
}: {
  rows: Record<string, string>[];
  columns: MouColumn[];
  defaultSort?: { field: string; direction: "asc" | "desc" };
  timestampField?: string;
  organizationField?: string;
}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => computeEstimatedWidths(rows, columns));
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(defaultSort ?? null);
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
      setColumnWidths(computeMeasuredWidths(rows, columns));
    }
  });

  const filterOptionsByField = useMemo(() => {
    const optionsByField: Record<string, string[]> = {};
    for (const column of columns) {
      if (!column.isFilterable) continue;
      const distinctValues = new Set<string>();
      for (const row of rows) {
        const rawValue = getDisplayValue(row, column);
        if (column.isMultiSelect) {
          for (const piece of splitMultiSelectValue(rawValue)) distinctValues.add(piece);
        } else if (rawValue) {
          distinctValues.add(rawValue);
        }
      }
      optionsByField[column.field] = Array.from(distinctValues).sort((a, b) => a.localeCompare(b));
    }
    return optionsByField;
  }, [rows, columns]);

  const filteredRows = useMemo(() => {
    const activeEntries = Object.entries(activeFilters).filter(([, values]) => values.length > 0);
    if (activeEntries.length === 0) return rows;

    return rows.filter((row) =>
      activeEntries.every(([field, values]) => {
        const column = columns.find((c) => c.field === field);
        const rawValue = row[field] ?? "";
        if (column?.isMultiSelect) {
          const rowValues = splitMultiSelectValue(rawValue);
          return values.some((selected) => rowValues.includes(selected));
        }
        return values.includes(rawValue);
      }),
    );
  }, [rows, columns, activeFilters]);

  const searchedRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return filteredRows;
    return filteredRows.filter((row) => columns.some((column) => getDisplayValue(row, column).toLowerCase().includes(query)));
  }, [filteredRows, columns, searchText]);

  const sortedRows = useMemo(() => {
    if (!sort) return searchedRows;
    const column = columns.find((c) => c.field === sort.field);
    if (!column) return searchedRows;

    const withValues = searchedRows.map((row) => ({
      row,
      value: column.isDate ? new Date(getDisplayValue(row, column)).getTime() || 0 : getDisplayValue(row, column).toLowerCase(),
    }));
    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.direction === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return withValues.map((entry) => entry.row);
  }, [searchedRows, sort, columns]);

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
          placeholder="Search…"
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
        {columns.filter((column) => column.isFilterable).map((column) => (
          <FilterDropdown
            key={column.field}
            label={column.label}
            options={filterOptionsByField[column.field] ?? []}
            selected={activeFilters[column.field] ?? []}
            onChange={(values) => setActiveFilters((previous) => ({ ...previous, [column.field]: values }))}
            isOpen={openFilterField === column.field}
            onToggle={() => setOpenFilterField((current) => (current === column.field ? null : column.field))}
          />
        ))}
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
                      <span className="truncate" title={column.label}>{column.label}</span>
                      <span className="shrink-0 text-slate-300">{isSorted ? (sort.direction === "asc" ? "▲" : "▼") : "⇅"}</span>
                    </button>
                    {!column.isEditable ? (
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
            {sortedRows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                {columns.map((column) => {
                  if (column.isEditable) {
                    return (
                      <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                        <EditableAdminNotesCell
                          timestamp={timestampField ? row[timestampField] ?? "" : ""}
                          organizationName={organizationField ? row[organizationField] ?? "" : ""}
                          initialValue={getDisplayValue(row, column)}
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                      <ReadOnlyCell value={getDisplayValue(row, column)} multiline={column.multiline} />
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
