"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, List, Mail, MapPin, Phone, Search, X } from "lucide-react";

import ProvidersMap from "@/components/marketing/providers/ProvidersMap";
import { splitServiceTypes } from "@/components/marketing/providers/service-types";
import { updateSearchParams, useUrlList, useUrlText, useUrlValue } from "@/lib/url-state";
import { Input } from "@/components/ui/input";
import { DropdownPanel } from "@/components/marketing/DropdownPanel";
import { SelectAllButton } from "@/components/ui/select-all-button";
import { matchesLanguageFilter } from "@/lib/language-filter";
import { cn } from "@/lib/utils";
import type { Provider } from "@/app/api/airtable";

type FilterKey = "languages" | "serviceTypes";
const VIEW_MODES = ["grid", "list", "map"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

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
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-2 text-xs font-medium shadow-sm transition-colors cursor-pointer sm:px-3.5 sm:text-sm ${
          selected.length === 0 ? "border-[#a8d0e6] bg-white text-slate-700" : "border-sky-200 bg-sky-50 text-sky-800"
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown size={14} className={isOpen ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
      </button>

      {isOpen ? (
        <DropdownPanel
          preferredSide={align}
          placementKey={buttonLabel}
          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:w-max sm:min-w-60 sm:max-w-96 ${
            align === "right" ? "sm:left-auto sm:right-0" : "sm:left-0 sm:right-auto"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <SelectAllButton
                options={options}
                visibleOptions={visibleOptions}
                selected={selected}
                onSelect={onChange}
                className="text-xs font-medium text-sky-700 underline decoration-sky-300 hover:text-sky-800 cursor-pointer"
              />
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
                    className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input type="checkbox" checked={isActive} onChange={() => toggleOption(option)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer" />
                    <span className="min-w-0 break-words">{option}</span>
                  </label>
                );
              })
            )}
          </div>
        </DropdownPanel>
      ) : null}
    </div>
  );
}

// Lets a long email wrap at natural points (after @ . - _) instead of mid-word. <wbr> only adds a
// break opportunity and no characters, so copying the email still yields the exact original text.
function BreakableEmail({ value }: { value: string }) {
  return (
    <>
      {value.split(/([@._-])/).map((part, index) => (
        <Fragment key={index}>
          {part}
          {/^[@._-]$/.test(part) ? <wbr /> : null}
        </Fragment>
      ))}
    </>
  );
}

const PROVIDER_LINK_CLASSES =
  "flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md";

// Logo + name + address. Shared by both layouts so they can't drift apart.
// Text sizes: 16px name, 13px address and contact, 14px description (in the card and row below), 13px languages. They were 14px,
// 12px and 12px, which is small for the older readers this site is for. The faint slate-400 languages text also fell short of the
// 4.5:1 contrast WCAG asks for (about 2.6:1); slate-500 passes (4.8:1).
function ProviderIdentity({
  provider,
  className,
  listLayout = false,
  showContact = false,
}: {
  provider: Provider;
  className?: string;
  /** List-row styling: the address wraps instead of truncating, with a little space under the name. */
  listLayout?: boolean;
  showContact?: boolean;
}) {
  const phone = provider.primary_phone_number?.trim();
  const email = provider.email?.trim();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs, not a fixed set next/image can optimize */}
        <img src={provider.logo || "/icons/Just_BIRD_logo_blue.png"} alt={provider.name} className="h-full w-full object-contain p-1.5" />
      </div>

      <div className="min-w-0">
        <h2 className="break-words text-base font-semibold text-slate-900">{provider.name}</h2>
        <p className={listLayout ? "mt-1 break-words text-[13px] text-slate-500" : "truncate text-[13px] text-slate-500"}>{provider.address || "Location not listed"}</p>

        {/* Plain text, not mailto:/tel: links — the whole row is already a <Link>, and a link can't contain a link. */}
        {showContact && (phone || email) ? (
          <div className="mt-1 flex flex-col gap-0.5 text-[13px] text-slate-500">
            {phone ? (
              <p className="flex items-start gap-1.5">
                <Phone size={13} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="sr-only">Phone:</span>
                <span className="min-w-0 break-words">{phone}</span>
              </p>
            ) : null}
            {email ? (
              <p className="flex items-start gap-1.5">
                <Mail size={13} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="sr-only">Email:</span>
                <span className="min-w-0 break-words">
                  <BreakableEmail value={email} />
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Grid view: the original card, unchanged.
function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link href={`/providers/${provider.id}`} className={PROVIDER_LINK_CLASSES}>
      <ProviderIdentity provider={provider} />

      {/* Cut off after 5 lines, not 4: at 14px, four lines cut off far more of the description on the narrower cards of a smaller window. */}
      {provider.description ? (
        <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-[22px] text-slate-600">{provider.description}</p>
      ) : null}

      {provider.language_support.length > 0 ? (
        <p className="mt-3 truncate text-[13px] text-slate-500">{provider.language_support.join(" · ")}</p>
      ) : null}
    </Link>
  );
}

// List view: one full-width row per provider. Same information as the card, but on wide screens
// the description sits beside the name instead of underneath it, so far more of it is visible
// before it's truncated. Below lg it stacks like a single full-width card.
// The description is capped at 56ch, which is about 70 characters per line (a "ch" is the width of a zero, a little wider than the
// average letter): beside the name it would otherwise run the whole rest of the row, over 150 characters per line on a wide screen,
// which is too long to read comfortably.
function ProviderRow({ provider }: { provider: Provider }) {
  const hasDetails = Boolean(provider.description) || provider.language_support.length > 0;

  return (
    <Link href={`/providers/${provider.id}`} className={cn(PROVIDER_LINK_CLASSES, "lg:flex-row lg:items-start lg:gap-6")}>
      <ProviderIdentity provider={provider} className="lg:w-72 lg:shrink-0" listLayout showContact />

      {hasDetails ? (
        <div className="mt-3 flex min-w-0 flex-1 flex-col gap-2 lg:mt-0">
          {provider.description ? (
            <p className="line-clamp-6 max-w-[56ch] whitespace-pre-line text-sm leading-[22px] text-slate-600">{provider.description}</p>
          ) : null}

          {provider.language_support.length > 0 ? (
            <p className="truncate text-[13px] text-slate-500">{provider.language_support.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

export default function ProvidersGrid({ providers }: { providers: Provider[] }) {
  // The search, the filters and the view are kept in the address (?q=...&language=...&serviceType=...&view=map), so that this page can
  // be bookmarked or shared, and Back (from a provider's page, say) brings it back as it was. Changing them replaces the current history
  // entry instead of adding one, so Back still leaves the page in one step.
  const { text: searchText, setText: setSearchText, commit: commitSearchText, reset: resetSearchText, clear: clearSearchText } = useUrlText("q");
  const [openFilterKey, setOpenFilterKey] = useState<FilterKey | null>(null);
  const [viewMode, setViewMode] = useUrlValue<ViewMode>("view", VIEW_MODES, "grid");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  // Anything in the address that isn't one of the options (a bookmark from before one was removed) is ignored.
  const [selectedLanguages, setSelectedLanguages] = useUrlList("language", languageOptions);
  const [selectedServiceTypes, setSelectedServiceTypes] = useUrlList("serviceType", serviceTypeOptions);
  const activeFilters = useMemo<Record<FilterKey, string[]>>(
    () => ({ languages: selectedLanguages, serviceTypes: selectedServiceTypes }),
    [selectedLanguages, selectedServiceTypes],
  );

  // The results scroll inside their own area (the controls above stay put), so when the search, a filter or the view changes,
  // start again from the top of the new results instead of wherever the old list happened to be scrolled to.
  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, [searchText, activeFilters, viewMode]);

  const filteredProviders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return providers.filter((provider) => {
      if (!matchesLanguageFilter(activeFilters.languages, provider.language_support)) return false;

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
    resetSearchText();
    updateSearchParams((params) => {
      params.delete("q");
      params.delete("language");
      params.delete("serviceType");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Below lg: the search box and the icon-only view switch share the first row, and the filters (with Clear All) sit on the row
          below (the DOM order is search, filters, switch, so `order` rearranges it). From lg up it is one row, in DOM order. One row
          needs about 900px beside the sidebar, which is why it doesn't start any sooner: any narrower and the search box is squeezed
          to almost nothing, and more so when Clear All appears next to the filters. */}
      <div className="relative z-30 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2 lg:flex lg:items-center lg:gap-3">
        <div className="order-1 flex min-w-0 items-center gap-2 rounded-lg border border-[#a8d0e6] bg-white px-3 py-2 shadow-sm sm:px-3.5 lg:order-none lg:max-w-md lg:flex-1">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onBlur={commitSearchText}
            placeholder="Search by name, address, service type, or description"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 max-sm:text-ellipsis"
          />
          {searchText ? (
            <button
              type="button"
              onClick={clearSearchText}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="order-3 col-span-2 flex flex-wrap gap-1.5 justify-self-start sm:gap-2 lg:order-none lg:col-auto">
          <FilterDropdown
            label="Languages"
            options={languageOptions}
            selected={activeFilters.languages}
            onChange={(values) => setSelectedLanguages(values)}
            isOpen={openFilterKey === "languages"}
            onToggle={() => setOpenFilterKey((current) => (current === "languages" ? null : "languages"))}
          />
          <FilterDropdown
            label="Service Types"
            options={serviceTypeOptions}
            selected={activeFilters.serviceTypes}
            onChange={(values) => setSelectedServiceTypes(values)}
            isOpen={openFilterKey === "serviceTypes"}
            onToggle={() => setOpenFilterKey((current) => (current === "serviceTypes" ? null : "serviceTypes"))}
            align="right"
          />
          {/* Clear All sits to the right of the filters on every screen size, since it clears them (and the search). It is pushed to
              the right (ml-auto) inside a row that is only as wide as its contents (justify-self-start), so there is nothing to push
              into while everything fits on one line, and it sits right beside the last filter. When the row has to wrap, it is full
              width, and Clear All goes to the right edge, on a line of its own if the filters filled the last one. */}
          {hasActiveSearchOrFilters ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="ml-auto shrink-0 self-center text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700 cursor-pointer"
            >
              Clear All
            </button>
          ) : null}
        </div>

        {/* One control for how the results are shown. Icon-only at every size (the labels are in aria-label/title). On a phone it
            sits to the right of the search box; from sm up it sits at the right end of the row. */}
        <div
          role="group"
          aria-label="View"
          className="order-2 flex shrink-0 items-center rounded-lg border border-[#a8d0e6] bg-white p-0.5 shadow-sm lg:order-none lg:ml-auto"
        >
          {(
            [
              { mode: "grid", label: "Grid", Icon: LayoutGrid },
              { mode: "list", label: "List", Icon: List },
              { mode: "map", label: "Map", Icon: MapPin },
            ] as const
          ).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-label={`${label} view`}
              title={`${label} view`}
              className={cn(
                "flex items-center justify-center rounded-md px-3 py-2 transition-colors cursor-pointer sm:p-2",
                viewMode === mode ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* How many organizations are showing, just above the results (like the count on Search Services), so it reads as being about
          the list below the search and filters. */}
      <p className="mt-3 shrink-0 text-sm text-slate-600 sm:mt-4">
        {hasActiveSearchOrFilters
          ? `Showing ${filteredProviders.length} of ${providers.length} organizations`
          : `${filteredProviders.length} organization${filteredProviders.length === 1 ? "" : "s"} in the BIRD directory`}
      </p>

      {/* The only part that scrolls, in a frame. For the cards the frame is an outlined panel with no fill (a 1px light-blue border, like
          the search box and filters, plus a very soft shadow that only shows outside the edge), so cards scrolling out of the top
          read as going behind a window edge, not as being cut off. The panel sits right under the count above it. The map has its
          own outline, so its frame only gets a small margin.
          The border and rounded corners are on the frame, not on the scrolling box inside it, on purpose: a browser draws a scroll
          bar as a plain rectangle that isn't clipped to the rounded corners of the box it scrolls, so with the border on the
          scrolling box the scroll bar covered the curve of the border at the top and bottom right. The frame has overflow-hidden,
          which clips the scroll bar (and the cards) to the inner curve of the border.
          `relative` on the scrolling box matters: without it, absolutely positioned content inside (like the sr-only "Phone:" and
          "Email:" labels in the list rows) isn't clipped by it and stretches the whole page's scrollable area instead. The padding
          gives the cards' shadows room. (The empty-state message sits on the page's gray, so its text is slate-600.) */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          viewMode === "map"
            ? "-mx-1 mt-0.5 sm:mt-1"
            : "mt-1.5 overflow-hidden rounded-2xl border border-[#a8d0e6] shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:mt-2",
        )}
      >
        <div
          ref={scrollAreaRef}
          className={cn("relative min-h-0 flex-1 overflow-y-auto", viewMode === "map" ? "px-1 py-1" : "p-2 sm:p-3")}
        >
          {viewMode === "map" ? (
            // The map takes the place of the cards and fills the space; the search and filters above stay live and drive the pins.
            <div className="h-full">
              <ProvidersMap providers={filteredProviders} />
            </div>
          ) : filteredProviders.length === 0 ? (
            // Without this the panel would just be an empty box.
            <p className="px-2 py-8 text-center text-sm text-slate-600">
              {providers.length === 0 ? "There are no organizations in the directory yet." : "No organizations match your search or filters."}
            </p>
          ) : (
            // The list is a one-column grid, not a flex column, on purpose: a grid's minmax(0, 1fr) track stops a row's
            // non-wrapping content (such as a long languages line) from widening the whole page on a narrow phone.
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-2 sm:gap-3"
              }
            >
              {filteredProviders.map((provider) =>
                viewMode === "grid" ? (
                  <ProviderCard key={provider.id} provider={provider} />
                ) : (
                  <ProviderRow key={provider.id} provider={provider} />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
