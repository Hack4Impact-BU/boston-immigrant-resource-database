"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ServiceType } from "@/app/api/airtable";

type ServiceTypesPickerProps = {
  serviceTypes: ServiceType[];
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
};

export function ServiceTypesPicker({ serviceTypes, selectedIds, onChange }: ServiceTypesPickerProps) {
  const [filter, setFilter] = useState("");

  const selectedNameById = useMemo(() => new Map(serviceTypes.map((type) => [type.id, type.name])), [serviceTypes]);

  const filteredServiceTypes = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) {
      return serviceTypes;
    }

    return serviceTypes.filter((type) => type.name.toLowerCase().includes(normalizedFilter));
  }, [filter, serviceTypes]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  return (
    <div className="space-y-2">
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"
            >
              {selectedNameById.get(id) ?? id}
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Remove ${selectedNameById.get(id) ?? "service type"}`}
                className="text-sky-500 hover:text-sky-800"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No service types selected yet.</p>
      )}

      <Input
        type="text"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Search service types..."
        className="h-8 text-xs"
      />

      <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
        {filteredServiceTypes.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-slate-400">No service types match &ldquo;{filter}&rdquo;.</p>
        ) : (
          filteredServiceTypes.map((type) => {
            const isSelected = selectedIds.includes(type.id);
            return (
              <label
                key={type.id}
                className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(type.id)}
                  className="mt-0.5"
                />
                <span>{type.name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
