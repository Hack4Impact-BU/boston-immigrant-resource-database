"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Language } from "@/app/api/airtable";

type LanguageSupportPickerProps = {
  languages: Language[];
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
};

export function LanguageSupportPicker({ languages, selectedIds, onChange }: LanguageSupportPickerProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-slate-200 bg-white p-3">
      {languages.map((language) => (
        <label key={language.id} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700">
          <Checkbox checked={selectedIds.includes(language.id)} onCheckedChange={() => toggle(language.id)} />
          {language.name}
        </label>
      ))}
    </div>
  );
}
