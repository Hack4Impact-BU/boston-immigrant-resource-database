"use client";

import { useMemo, useState } from "react";

export type MouColumn = {
  field: string;
  label: string;
  multiline: boolean;
  isDate?: boolean;
};

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

function ReadOnlyCell({ value, multiline }: { value: string; multiline?: boolean }) {
  if (multiline) {
    return <div title={value} className="whitespace-pre-wrap break-words px-3 py-1.5 text-sm text-slate-700">{value || "—"}</div>;
  }
  return <div title={value} className="truncate px-3 py-1.5 text-sm text-slate-700">{value || "—"}</div>;
}

export default function MouResponsesTable({
  rows,
  columns,
  defaultSort,
}: {
  rows: Record<string, string>[];
  columns: MouColumn[];
  defaultSort?: { field: string; direction: "asc" | "desc" };
}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => computeEstimatedWidths(rows, columns));
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(defaultSort ?? null);
  const [resizingField, setResizingField] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  useState(() => {
    // Runs once on mount, after the DOM (and canvas measurement) is available.
    if (typeof document !== "undefined") {
      setColumnWidths(computeMeasuredWidths(rows, columns));
    }
  });

  const searchedRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => columns.some((column) => getDisplayValue(row, column).toLowerCase().includes(query)));
  }, [rows, columns, searchText]);

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
                {columns.map((column) => (
                  <td key={column.field} className="h-px overflow-hidden px-1 py-1">
                    <ReadOnlyCell value={getDisplayValue(row, column)} multiline={column.multiline} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
