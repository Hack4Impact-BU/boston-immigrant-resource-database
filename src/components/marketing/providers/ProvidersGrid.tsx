"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Provider } from "@/app/api/airtable";

type FilterKey = "languages" | "serviceTypes";

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  isOpen,
  onToggle,
  align = "left",
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  /** Which edge the open panel grows from — "right" keeps it from overflowing/shifting content when the button sits toward the right of the filter row. */
  align?: "left" | "right";
}) {
  const [searchText, setSearchText] = useState("");

  function toggleOption(option: string) {
    onChange(selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option]);
  }

  const buttonLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`;
  const visibleOptions = searchText.trim()
    ? options.filter((option) => option.toLowerCase().includes(searchText.trim().toLowerCase()))
    : options;

  return (
    <div className="min-w-0 sm:relative sm:z-50" data-filter-dropdown-root>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${
          selected.length === 0 ? "border-slate-200 bg-white text-slate-700" : "border-sky-200 bg-sky-50 text-sky-800"
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown size={14} className={isOpen ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:w-max sm:min-w-60 sm:max-w-[calc(100vw-2rem)] ${
            align === "right" ? "sm:left-auto sm:right-0" : "sm:left-0 sm:right-auto"
          }`}
        >
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
          <div className="border-b border-slate-100 p-2">
            <Input
              type="text"
              autoFocus
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 text-xs"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No options found.</p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No matches.</p>
            ) : (
              visibleOptions.map((option) => {
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

function splitServiceTypes(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export default function ProvidersGrid({ providers }: { providers: Provider[] }) {
  const [searchText, setSearchText] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string[]>>({ languages: [], serviceTypes: [] });
  const [openFilterKey, setOpenFilterKey] = useState<FilterKey | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-filter-dropdown-root]")) {
        setOpenFilterKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languageOptions = useMemo(() => {
    const distinct = new Set<string>();
    for (const provider of providers) {
      for (const language of provider.language_support) {
        distinct.add(language);
      }
    }
    return Array.from(distinct).sort((a, b) => a.localeCompare(b));
  }, [providers]);

  const serviceTypeOptions = useMemo(() => {
    const distinct = new Set<string>();
    for (const provider of providers) {
      for (const serviceType of splitServiceTypes(provider.service_types)) {
        distinct.add(serviceType);
      }
    }
    return Array.from(distinct).sort((a, b) => a.localeCompare(b));
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return providers.filter((provider) => {
      if (activeFilters.languages.length > 0) {
        const matchesLanguage = activeFilters.languages.some((language) => provider.language_support.includes(language));
        if (!matchesLanguage) return false;
      }

      if (activeFilters.serviceTypes.length > 0) {
        const providerServiceTypes = splitServiceTypes(provider.service_types);
        const matchesServiceType = activeFilters.serviceTypes.some((serviceType) => providerServiceTypes.includes(serviceType));
        if (!matchesServiceType) return false;
      }

      if (query) {
        const haystack = [provider.name, provider.address, provider.service_types, provider.description].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [providers, activeFilters, searchText]);

  const hasActiveSearchOrFilters = Boolean(searchText) || activeFilters.languages.length > 0 || activeFilters.serviceTypes.length > 0;

  function handleClearAll() {
    setSearchText("");
    setActiveFilters({ languages: [], serviceTypes: [] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-600">
          {filteredProviders.length} organization{filteredProviders.length === 1 ? "" : "s"} in the BIRD directory
        </p>
        {hasActiveSearchOrFilters ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700 cursor-pointer"
          >
            Clear All
          </button>
        ) : null}
      </div>

      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:max-w-md">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name, address, service type, or description"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          {searchText ? (
            <button
              type="button"
              onClick={() => setSearchText("")}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Languages"
            options={languageOptions}
            selected={activeFilters.languages}
            onChange={(values) => setActiveFilters((previous) => ({ ...previous, languages: values }))}
            isOpen={openFilterKey === "languages"}
            onToggle={() => setOpenFilterKey((current) => (current === "languages" ? null : "languages"))}
          />
          <FilterDropdown
            label="Service Types"
            options={serviceTypeOptions}
            selected={activeFilters.serviceTypes}
            onChange={(values) => setActiveFilters((previous) => ({ ...previous, serviceTypes: values }))}
            isOpen={openFilterKey === "serviceTypes"}
            onToggle={() => setOpenFilterKey((current) => (current === "serviceTypes" ? null : "serviceTypes"))}
            align="right"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProviders.map((provider) => (
          <Link
            key={provider.id}
            href={`/providers/${provider.id}`}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs, not a fixed set next/image can optimize */}
                <img src={provider.logo || "/icons/Just_BIRD_logo_blue.png"} alt={provider.name} className="h-full w-full object-contain p-1.5" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900">{provider.name}</h2>
                <p className="truncate text-xs text-slate-500">{provider.address || "Location not listed"}</p>
              </div>
            </div>

            {provider.description ? (
              <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-slate-600">{provider.description}</p>
            ) : null}

            {provider.language_support.length > 0 ? (
              <p className="mt-3 truncate text-xs text-slate-400">{provider.language_support.join(" · ")}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
