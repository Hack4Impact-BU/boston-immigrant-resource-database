"use client";

import { useEffect, useMemo, useState } from "react";

import { createServiceTypeAction, updateServiceTypeNameAction } from "@/features/admin/service-types/manage-service-types";
import type { AdminServiceTypeRecord } from "@/lib/airtable";

type ColumnField = "name" | "lastModified";
type SaveState = "idle" | "saving" | "saved" | "error";

const COLUMNS: { field: ColumnField; label: string; editable: boolean }[] = [
  { field: "name", label: "Name", editable: true },
  { field: "lastModified", label: "Last Modified", editable: false },
];

const MIN_COLUMN_WIDTH = 70;
// Same reasoning as the other admin tables: the input itself reserves px-2
// (8px) + pr-14 (56px, for the save indicator) = 64px before any text even
// starts, plus the cell's own padding and some breathing room.
const CELL_HORIZONTAL_PADDING = 112;
const READONLY_CELL_HORIZONTAL_PADDING = 40;
const FALLBACK_CHAR_WIDTH = 7.5;

function formatLastModified(isoString: string): string {
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

function getDisplayValue(serviceType: AdminServiceTypeRecord, field: ColumnField): string {
  if (field === "lastModified") return formatLastModified(serviceType.lastModified);
  return serviceType.name;
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

function paddingForColumn(column: { editable: boolean }): number {
  return column.editable ? CELL_HORIZONTAL_PADDING : READONLY_CELL_HORIZONTAL_PADDING;
}

function computeEstimatedWidths(serviceTypes: AdminServiceTypeRecord[]): Record<ColumnField, number> {
  const widths = {} as Record<ColumnField, number>;

  for (const column of COLUMNS) {
    const longest = Math.max(
      column.label.length,
      ...serviceTypes.map((serviceType) => getDisplayValue(serviceType, column.field).length),
    );
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, longest * FALLBACK_CHAR_WIDTH + paddingForColumn(column));
  }

  return widths;
}

function computeMeasuredWidths(serviceTypes: AdminServiceTypeRecord[]): Record<ColumnField, number> {
  const headerFont = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const cellFont = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const widths = {} as Record<ColumnField, number>;

  for (const column of COLUMNS) {
    const headerWidth = measureTextWidth(column.label, headerFont);
    const longestCellWidth = Math.max(
      0,
      ...serviceTypes.map((serviceType) => measureTextWidth(getDisplayValue(serviceType, column.field), cellFont)),
    );
    widths[column.field] = Math.max(MIN_COLUMN_WIDTH, Math.max(headerWidth, longestCellWidth) + paddingForColumn(column));
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

function EditableNameCell({ recordId, initialValue }: { recordId: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleBlur() {
    const trimmed = value.trim();
    if (trimmed === lastSaved) return;

    if (trimmed === "") {
      setValue(lastSaved);
      return;
    }

    setSaveState("saving");
    try {
      await updateServiceTypeNameAction({ recordId, name: trimmed });
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

function ReadOnlyCell({ value }: { value: string }) {
  return (
    <div title={value} className="truncate px-3 py-1.5 text-sm text-slate-400">
      {value}
    </div>
  );
}

function AddServiceTypeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (serviceType: AdminServiceTypeRecord) => void;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed === "") {
      setError("Name can't be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createServiceTypeAction(trimmed);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.2)]"
      >
        <h2 className="text-base font-semibold text-slate-900">Add Service Type</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="e.g. Legal Aid"
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
          />
          {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg bg-[#5B8FD4] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#4A7EC3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServiceTypesTable({ serviceTypes: initialServiceTypes }: { serviceTypes: AdminServiceTypeRecord[] }) {
  const [serviceTypes, setServiceTypes] = useState(initialServiceTypes);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnField, number>>(() => computeEstimatedWidths(initialServiceTypes));
  const [sort, setSort] = useState<{ field: ColumnField; direction: "asc" | "desc" } | null>({ field: "name", direction: "asc" });
  const [resizingField, setResizingField] = useState<ColumnField | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setColumnWidths(computeMeasuredWidths(serviceTypes));
    // Only recompute when the underlying data changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTypes]);

  const searchedServiceTypes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return serviceTypes;
    return serviceTypes.filter((serviceType) => serviceType.name.toLowerCase().includes(query));
  }, [serviceTypes, searchText]);

  const sortedServiceTypes = useMemo(() => {
    if (!sort) return searchedServiceTypes;

    const withValues = searchedServiceTypes.map((serviceType) => ({
      serviceType,
      value: getDisplayValue(serviceType, sort.field).toLowerCase(),
    }));

    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.direction === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return withValues.map((entry) => entry.serviceType);
  }, [searchedServiceTypes, sort]);

  function handleSortClick(field: ColumnField) {
    setSort((current) => {
      if (!current || current.field !== field) return { field, direction: "asc" };
      if (current.direction === "asc") return { field, direction: "desc" };
      return null;
    });
  }

  function handleResizeStart(event: React.MouseEvent, field: ColumnField) {
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
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name…"
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
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-[#5B8FD4] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4A7EC3]"
        >
          + Add Service Type
        </button>
      </div>

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
            {sortedServiceTypes.map((serviceType) => (
              <tr key={serviceType.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                <td className="overflow-hidden px-1 py-1">
                  <EditableNameCell recordId={serviceType.id} initialValue={serviceType.name} />
                </td>
                <td className="overflow-hidden px-1 py-1">
                  <ReadOnlyCell value={formatLastModified(serviceType.lastModified)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen ? (
        <AddServiceTypeModal
          onClose={() => setIsAddModalOpen(false)}
          onCreated={(created) => setServiceTypes((previous) => [created, ...previous])}
        />
      ) : null}
    </div>
  );
}
