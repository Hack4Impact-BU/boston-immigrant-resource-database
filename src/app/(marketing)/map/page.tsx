"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import Sidebar from "@/components/marketing/Sidebar";
import { ChevronDown, LoaderCircle, MapPinned, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatRelativeUpdateDate, formatRelativeUpdateDateShort } from "@/lib/dates";
import { buildOpenStreetMapEmbedUrl } from "@/lib/openstreetmap";

type Provider = {
  id: string;
  name: string;
  email: string;
  primary_phone_number: string;
  secondary_phone_number: string;
  address: string;
  status?: string;
  website: string;
  google_maps_link: string;
  service_types?: string;
  description: string;
  language_support: string[];
  services: string;
  logo: string;
  latitude: number | null;
  longitude: number | null;
};

type Service = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  status: string;
  link?: string;
  service_types: string;
  provider_email: string;
  provider_record_ID?: string;
  last_modified?: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type ServiceWithProvider = Service & {
  providerDetails?: Provider;
};

function getProviderRecordId(service: Service) {
  return service.provider_record_ID || service.provider;
}

function normalizeText(value: string | undefined) {
  return (value ?? "").toLowerCase().trim();
}

/**
 * Strips a trailing US zip code (5-digit or ZIP+4) from an address string,
 * leaving everything else — street, floor/suite, city, state — intact.
 * Targets the zip by its distinctive trailing-digits pattern rather than
 * splitting on comma count, since real addresses in this dataset vary from
 * 2 to 4 comma-separated segments (a floor or suite adds one), and some
 * addresses have no zip at all. A pattern match handles all of these
 * correctly; slicing by segment count would not.
 */
function formatAddressWithoutZip(address: string | undefined) {
  return (address ?? "").replace(/\s*,?\s*\d{5}(-\d{4})?\s*$/, "").trim();
}

/**
 * Fallback for providers that don't have a stored Latitude/Longitude yet
 * (pre-dating the switch to storing coordinates permanently at
 * create/edit time). Calls the server-side geocode-provider route, which
 * uses Google's Geocoding API and writes the result back to Airtable —
 * so this fallback only ever runs once per provider, ever. No client-side
 * cache is needed here since the server-side write-back is what actually
 * makes repeat calls unnecessary.
 */
async function fetchFallbackCoordinates(providerId: string): Promise<Coordinates | null> {
  try {
    const response = await fetch("/api/geocode-provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { lat: number | null; lng: number | null };

    return data.lat !== null && data.lng !== null ? { lat: data.lat, lng: data.lng } : null;
  } catch {
    return null;
  }
}

function matchesSearch(service: ServiceWithProvider, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [service.name, service.description, service.service_types, service.providerDetails?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function MapPage() {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const hasActiveSearchOrFilters =
    search.trim().length > 0 ||
    providerFilter.length > 0 ||
    languageFilter.length > 0 ||
    serviceTypeFilter.length > 0 ||
    statusFilter.length > 0;

  function handleClearAll() {
    setSearch("");
    setProviderFilter([]);
    setLanguageFilter([]);
    setServiceTypeFilter([]);
    setStatusFilter([]);
  }

  const [openFilterMenu, setOpenFilterMenu] = useState<"provider" | "language" | "serviceType" | "status" | "sort" | null>(null);
  const [sortOption, setSortOption] = useState<
    | "providerName-asc"
    | "providerName-desc"
    | "serviceName-asc"
    | "serviceName-desc"
    | "lastUpdated-asc"
    | "lastUpdated-desc"
    | "status-asc"
    | "status-desc"
  >("lastUpdated-desc");
  const [filterSearchText, setFilterSearchText] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<"map" | "description">("map");
  const [providerCoordinates, setProviderCoordinates] = useState<Record<string, Coordinates | null>>({});
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [servicesResponse, providersResponse] = await Promise.all([
          fetch("/api/services", { signal: abortController.signal }),
          fetch("/api/providers", { signal: abortController.signal }),
        ]);

        if (!servicesResponse.ok || !providersResponse.ok) {
          throw new Error("Failed to load map data");
        }

        const [servicesData, providersData] = (await Promise.all([
          servicesResponse.json(),
          providersResponse.json(),
        ])) as [Service[], Provider[]];

        if (!active) {
          return;
        }

        setServices(servicesData);
        setProviders(providersData);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load map data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
      abortController.abort();
    };
  }, []);

  const providerByRecordId = useMemo(() => {
    return new Map(providers.map((provider) => [provider.id, provider]));
  }, [providers]);

  const providerOptions = useMemo(() => {
    return providers.map((provider) => provider.name).filter(Boolean).sort((left, right) => left.localeCompare(right));
  }, [providers]);

  const languageOptions = useMemo(() => {
    const uniqueLanguages = new Set<string>();

    providers.forEach((provider) => {
      provider.language_support.forEach((language) => {
        if (language) {
          uniqueLanguages.add(language);
        }
      });
    });

    return Array.from(uniqueLanguages).sort((left, right) => left.localeCompare(right));
  }, [providers]);

  const statusOptions = useMemo(() => {
    return ["Open", "Contact Provider", "Waitlist", "Full"];
  }, []);

  const serviceTypeOptions = useMemo(() => {
    const uniqueServiceTypes = new Set<string>();

    services.forEach((service) => {
      service.service_types
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => uniqueServiceTypes.add(value));
    });

    return Array.from(uniqueServiceTypes).sort((left, right) => left.localeCompare(right));
  }, [services]);

  const servicesWithProviders = useMemo<ServiceWithProvider[]>(() => {
    return services.map((service) => ({
      ...service,
      providerDetails: providerByRecordId.get(getProviderRecordId(service)),
    }));
  }, [providerByRecordId, services]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return servicesWithProviders.filter((service) => {
      const providerName = service.providerDetails?.name || "";
      const serviceLanguages = service.providerDetails?.language_support || [];
      const serviceTypes = service.service_types
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const matchesProvider = providerFilter.length === 0 || providerFilter.includes(providerName);
      const matchesLanguage =
        languageFilter.length === 0 ||
        languageFilter.some((language) => serviceLanguages.includes(language)) ||
        serviceLanguages.includes("All Languages");
      const matchesServiceType =
        serviceTypeFilter.length === 0 || serviceTypeFilter.some((type) => serviceTypes.includes(type));
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(service.status);

      return (
        matchesSearch(service, normalizedSearch) &&
        matchesProvider &&
        matchesLanguage &&
        matchesServiceType &&
        matchesStatus
      );
    });
  }, [languageFilter, providerFilter, search, serviceTypeFilter, servicesWithProviders, statusFilter]);

  const sortedFilteredServices = useMemo(() => {
    const sorted = [...filteredServices];
    // Most-available-first ordering, not alphabetical — a plain alphabetical
    // sort on these four values would be meaningless (it'd read "Contact
    // Provider, Full, Open, Waitlist", telling the viewer nothing useful).
    const statusPriority: Record<string, number> = { Open: 0, "Contact Provider": 1, Waitlist: 2, Full: 3 };
    const getStatusPriority = (status: string) => statusPriority[status] ?? 99;

    sorted.sort((left, right) => {
      switch (sortOption) {
        case "providerName-asc":
          return (left.providerDetails?.name || "").localeCompare(right.providerDetails?.name || "");
        case "providerName-desc":
          return (right.providerDetails?.name || "").localeCompare(left.providerDetails?.name || "");
        case "serviceName-asc":
          return left.name.localeCompare(right.name);
        case "serviceName-desc":
          return right.name.localeCompare(left.name);
        case "lastUpdated-asc":
          return (new Date(left.last_modified || 0).getTime() || 0) - (new Date(right.last_modified || 0).getTime() || 0);
        case "lastUpdated-desc":
          return (new Date(right.last_modified || 0).getTime() || 0) - (new Date(left.last_modified || 0).getTime() || 0);
        case "status-asc":
          return getStatusPriority(left.status) - getStatusPriority(right.status);
        case "status-desc":
          return getStatusPriority(right.status) - getStatusPriority(left.status);
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredServices, sortOption]);

  const selectedService = useMemo(() => {
    return filteredServices.find((service) => service.id === selectedServiceId) ?? null;
  }, [filteredServices, selectedServiceId]);

  useEffect(() => {
    if (selectedServiceId && !selectedService) {
      setSelectedServiceId(null);
      setPanelView("map");
    }
  }, [selectedService, selectedServiceId]);

  useEffect(() => {
    if (openFilterMenu === null) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-filter-menu-root]")) {
        setOpenFilterMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openFilterMenu]);

  useEffect(() => {
    setFilterSearchText({});
  }, [openFilterMenu]);

  useEffect(() => {
    let cancelled = false;

    // Providers with a stored Latitude/Longitude (set automatically at
    // create/edit time going forward) resolve instantly, synchronously, no
    // network call at all — this is the common case for any provider that's
    // been created or resaved since the switch to Google-powered geocoding.
    const storedEntries = providers
      .filter((provider) => provider.latitude !== null && provider.longitude !== null)
      .map((provider) => [provider.id, { lat: provider.latitude as number, lng: provider.longitude as number }] as const);

    if (storedEntries.length > 0) {
      setProviderCoordinates((prev) => ({ ...prev, ...Object.fromEntries(storedEntries) }));
    }

    // Only providers without stored coordinates yet (pre-dating this change)
    // need the fallback. Google's rate limits are generous enough that these
    // don't need Nominatim-style throttling, and since each one gets written
    // back permanently, this list only ever shrinks over time.
    const providersNeedingFallback = providers
      .slice(0, 40)
      .filter((provider) => provider.latitude === null || provider.longitude === null);

    async function resolveFallbackCoordinates() {
      await Promise.all(
        providersNeedingFallback.map(async (provider) => {
          const coordinates = await fetchFallbackCoordinates(provider.id);

          if (cancelled) {
            return;
          }

          setProviderCoordinates((prev) => ({ ...prev, [provider.id]: coordinates }));
        })
      );
    }

    resolveFallbackCoordinates();

    return () => {
      cancelled = true;
    };
  }, [providers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerLayerRef.current) {
      return;
    }

    const markerLayer = markerLayerRef.current;
    const map = mapRef.current;

    const visibleLocations = filteredServices
      .map((service) => {
        const coordinates = providerCoordinates[getProviderRecordId(service)];
        return coordinates ? { service, coordinates } : null;
      })
      .filter((value): value is { service: ServiceWithProvider; coordinates: Coordinates } => Boolean(value));

    markerLayer.clearLayers();

    (async () => {
      const leafletModule = (await import("leaflet")) as typeof import("leaflet");
      const L = leafletModule;

      const markers = visibleLocations.map(({ service, coordinates }) => {
        const marker = L.marker([coordinates.lat, coordinates.lng], {
          icon: L.divIcon({
            className: "",
            html: `
              <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${
                "#f97316"
              };box-shadow:0 8px 18px rgba(15,23,42,0.18);border:3px solid white;">
                <div style="width:10px;height:10px;border-radius:9999px;background:white;"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          }),
        });

        const provider = service.providerDetails;
        const languages = provider?.language_support?.slice(0, 3).join(" · ") || "Language support varies";
        const location = provider?.address || "Location not listed";
        const serviceSummary = service.service_types || service.description || "Community service";
        const providerName = provider?.name || "Provider unavailable";

        marker.bindPopup(`
          <div style="max-width:220px;font-family:Arial, sans-serif;">
            <div style="font-size:12px;color:#475569;margin-bottom:6px;">${providerName}</div>
            <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">${service.name}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:2px;">${location}</div>
            <div style="font-size:11px;color:#0f172a;margin-bottom:6px;">${languages}</div>
            <div style="font-size:12px;color:#334155;white-space:pre-line;">${serviceSummary}</div>
          </div>
        `);

        markerLayer.addLayer(marker);

        return { service, coordinates };
      });

      if (!markers.length) {
        return;
      }

      if (markers.length === 1) {
        map.setView([markers[0].coordinates.lat, markers[0].coordinates.lng], 12, {
          animate: true,
        });
        return;
      }

      const bounds = L.latLngBounds(markers.map((entry) => [entry.coordinates.lat, entry.coordinates.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.18), { animate: true });
    })();
  }, [filteredServices, mapReady, providerCoordinates]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [selectedService]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const leafletModule = (await import("leaflet")) as typeof import("leaflet");
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      const L = leafletModule;
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([42.361145, -71.057083], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    }

    initializeMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  const selectedServiceDescription = selectedService
    ? selectedService.description || "No description available."
    : null;

  const selectedServiceLocation = selectedService?.providerDetails?.address || "Location unavailable";
  const selectedServiceGoogleMapsUrl = selectedService?.providerDetails?.google_maps_link
    || (selectedService?.providerDetails?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedService.providerDetails.address)}`
      : null);
  const selectedServiceCoordinates = selectedService ? providerCoordinates[getProviderRecordId(selectedService)] : undefined;
  // A small, fixed-size box centered on the pin — OpenStreetMap's embed only
  // takes a bounding box, not a zoom level, so this controls how zoomed-in
  // the embedded view appears. ~0.006 degrees is roughly a close, walkable
  // neighborhood view.
  const selectedServiceMapEmbedUrl = selectedServiceCoordinates
    ? buildOpenStreetMapEmbedUrl(selectedServiceCoordinates.lat, selectedServiceCoordinates.lng)
    : null;
  const selectedServiceLanguages = selectedService?.providerDetails?.language_support?.join(", ") || "Language support varies";
  const selectedServiceProvider = selectedService?.providerDetails?.name || "Provider unavailable";
  const isDescriptionView = panelView === "description" && Boolean(selectedService);


  useEffect(() => {
    setProviderFilter((current) => {
      const stillValid = current.filter((value) => providerOptions.includes(value));
      return stillValid.length === current.length ? current : stillValid;
    });
  }, [providerOptions]);

  useEffect(() => {
    setLanguageFilter((current) => {
      const stillValid = current.filter((value) => languageOptions.includes(value));
      return stillValid.length === current.length ? current : stillValid;
    });
  }, [languageOptions]);

  useEffect(() => {
    setServiceTypeFilter((current) => {
      const stillValid = current.filter((value) => serviceTypeOptions.includes(value));
      return stillValid.length === current.length ? current : stillValid;
    });
  }, [serviceTypeOptions]);

  useEffect(() => {
    setStatusFilter((current) => {
      const stillValid = current.filter((value) => statusOptions.includes(value));
      return stillValid.length === current.length ? current : stillValid;
    });
  }, [statusOptions]);

  function toggleFilterValue(setter: (updater: (current: string[]) => string[]) => void, option: string) {
    setter((current) => (current.includes(option) ? current.filter((value) => value !== option) : [...current, option]));
  }

  const filterButtons = [
    {
      key: "provider" as const,
      label: "Provider",
      value: providerFilter,
      options: providerOptions,
      onToggle: (option: string) => toggleFilterValue(setProviderFilter, option),
    },
    {
      key: "language" as const,
      label: "Languages",
      value: languageFilter,
      options: languageOptions,
      onToggle: (option: string) => toggleFilterValue(setLanguageFilter, option),
    },
    {
      key: "serviceType" as const,
      label: "Service Type",
      value: serviceTypeFilter,
      options: serviceTypeOptions,
      onToggle: (option: string) => toggleFilterValue(setServiceTypeFilter, option),
    },
    {
      key: "status" as const,
      label: "Status",
      value: statusFilter,
      options: statusOptions,
      onToggle: (option: string) => toggleFilterValue(setStatusFilter, option),
    },
  ];

  useEffect(() => {
    if (panelView !== "map" || !mapRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [panelView]);

  return (
    <div className="flex min-h-dvh items-stretch bg-slate-100 p-0 m-0">
      <Sidebar isOpen={true} activePage="Search Services" />

      <main className="ml-55 flex min-h-dvh flex-1 overflow-hidden bg-[#f2f4f7] px-3 py-2 text-slate-800">
        <section className="mx-auto flex h-[calc(100dvh-1rem-4.5rem)] w-full max-w-400 flex-col gap-3 overflow-hidden rounded-[28px] bg-[#f8fafc] px-4 py-4 shadow-[0_0_0_1px_rgba(229,231,235,0.9)] md:h-[calc(100dvh-1rem)]">
          <div className="relative z-30 space-y-3 border-b border-slate-200 pb-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-[1.8rem] font-semibold tracking-tight text-[#4c8cc9] sm:text-[2.1rem]">
                Search Services
              </h1>
              {hasActiveSearchOrFilters ? (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="shrink-0 text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700 cursor-pointer"
                >
                  Clear All
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#a8d0e6] bg-white px-4 py-3 shadow-sm xl:max-w-[560px]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services by name or keywords"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {filterButtons.map((filter) => {
                  const isOpen = openFilterMenu === filter.key;
                  const selectedCount = filter.value.length;
                  const buttonLabel =
                    selectedCount === 0
                      ? filter.label
                      : selectedCount === 1
                        ? filter.value[0]
                        : `${filter.label} (${selectedCount})`;
                  const searchText = filterSearchText[filter.key] ?? "";
                  const visibleOptions = searchText.trim()
                    ? filter.options.filter((option) => option.toLowerCase().includes(searchText.trim().toLowerCase()))
                    : filter.options;

                  return (
                    <div key={filter.key} className="relative z-50" data-filter-menu-root>
                      <button
                        type="button"
                        onClick={() => setOpenFilterMenu(isOpen ? null : filter.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium shadow-sm transition-colors cursor-pointer ${
                          selectedCount === 0
                            ? "border-[#a8d0e6] bg-white text-slate-700"
                            : "border-sky-200 bg-[#f7fbff] text-sky-800"
                        }`}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="truncate">{buttonLabel}</span>
                        <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                      </button>

                      {isOpen ? (
                        <div
                          className={`absolute top-[calc(100%+0.5rem)] z-50 min-w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] ${
                            filter.key === "serviceType" || filter.key === "status" ? "right-0" : "left-0"
                          }`}
                        >
                          <div className="border-b border-slate-100 p-2">
                            <Input
                              type="text"
                              autoFocus
                              value={searchText}
                              onChange={(event) =>
                                setFilterSearchText((current) => ({ ...current, [filter.key]: event.target.value }))
                              }
                              placeholder={`Search ${filter.label.toLowerCase()}...`}
                              className="h-8 text-xs"
                            />
                          </div>
                          {selectedCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (filter.key === "provider") setProviderFilter([]);
                                else if (filter.key === "language") setLanguageFilter([]);
                                else if (filter.key === "serviceType") setServiceTypeFilter([]);
                                else setStatusFilter([]);
                              }}
                              className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-sky-700 hover:bg-sky-50 cursor-pointer"
                            >
                              Clear ({selectedCount})
                            </button>
                          ) : null}
                          <div className="max-h-72 overflow-y-auto p-2">
                            {visibleOptions.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-slate-400">No matches.</p>
                            ) : (
                              visibleOptions.map((option) => {
                                const isActive = filter.value.includes(option);
                                return (
                                  <label
                                    key={option}
                                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                      isActive ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Checkbox checked={isActive} onCheckedChange={() => filter.onToggle(option)} />
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
                })}
              </div>
            </div>
          </div>

          <div className="relative z-0 grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(360px,430px)_1fr]">
            <div className="flex min-h-0 flex-col rounded-[24px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <p className="text-sm text-slate-500">
                  Showing {sortedFilteredServices.length} service{sortedFilteredServices.length === 1 ? "" : "s"}
                </p>

                <div className="relative z-50" data-filter-menu-root>
                  {(() => {
                    const sortOptions: { value: typeof sortOption; label: string }[] = [
                      { value: "providerName-asc", label: "Provider Name (A → Z)" },
                      { value: "providerName-desc", label: "Provider Name (Z → A)" },
                      { value: "serviceName-asc", label: "Service Name (A → Z)" },
                      { value: "serviceName-desc", label: "Service Name (Z → A)" },
                      { value: "lastUpdated-desc", label: "Last Updated (Newest First)" },
                      { value: "lastUpdated-asc", label: "Last Updated (Oldest First)" },
                      { value: "status-asc", label: "Status (Most Available First)" },
                      { value: "status-desc", label: "Status (Least Available First)" },
                    ];
                    const isOpen = openFilterMenu === "sort";
                    const currentLabel = sortOptions.find((option) => option.value === sortOption)?.label ?? "Sort";

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenFilterMenu(isOpen ? null : "sort")}
                          className="inline-flex items-center gap-2 rounded-full border border-[#a8d0e6] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors cursor-pointer"
                          aria-expanded={isOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="truncate">Sort: {currentLabel}</span>
                          <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                        </button>

                        {isOpen ? (
                          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setSortOption(option.value);
                                  setOpenFilterMenu(null);
                                }}
                                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                                  option.value === sortOption ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="h-full space-y-2 overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
                    Loading services
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                    {error}
                  </div>
                ) : sortedFilteredServices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                    No services matched your search.
                  </div>
                ) : (
                  sortedFilteredServices.map((service) => {
                    const provider = service.providerDetails;
                    const languageList = provider?.language_support || [];
                    const matchingFilteredLanguages = languageList.filter((language) => languageFilter.includes(language));
                    const remainingLanguages = languageList.filter((language) => !languageFilter.includes(language));
                    const visibleLanguages = languageFilter.length > 0
                      ? [...matchingFilteredLanguages, ...remainingLanguages]
                      : languageList;
                    const languages = visibleLanguages.join(", ") || "Not listed";
                    const location = formatAddressWithoutZip(provider?.address) || "Location unavailable";
                    const providerName = provider?.name || "Provider unavailable";
                    const isSelected = selectedServiceId === service.id;
                    const description = service.description || service.service_types || provider?.description || "No description available.";

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setPanelView("description");
                        }}
                        className={`flex min-h-32 w-full border bg-white p-4 pb-3 text-left shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                          isSelected ? "border-sky-200 bg-[#f7fbff] ring-1 ring-sky-100" : "border-slate-200"
                        }`}
                      >
                        <div className="flex w-full gap-2">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={provider?.logo || "/icons/Just_BIRD_logo_blue.png"}
                              alt={provider?.name ?? "Provider logo"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[0.72rem] text-slate-900">{providerName}</p>
                                <h2 className="truncate text-[1.05rem] font-semibold tracking-tight text-slate-900">
                                  {service.name}
                                </h2>
                              </div>
                              <p
                                className={`mt-1 h-4 shrink-0 rounded-xs px-1 text-xs ${
                                  service.status === "Open"
                                    ? "bg-green-500"
                                    : service.status === "Full"
                                      ? "bg-rose-500"
                                      : service.status === "Waitlist"
                                        ? "bg-[#e69b00]"
                                        : service.status === "Contact Provider"
                                          ? "bg-[#abf7b1]"
                                          : "bg-slate-300"
                                }`}
                              >
                                {service.status}
                              </p>
                            </div>

                            <div className="mt-3 space-y-1 text-[0.72rem] text-slate-500">
                              <p className="truncate">
                                {location}
                              </p>
                              <p className="font-medium text-slate-900">
                                {languages}
                              </p>
                              <p>{formatRelativeUpdateDateShort(service.last_modified)}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] xl:h-full">

              <div className="flex min-h-0 flex-1 flex-col bg-white">
                {isDescriptionView && selectedService ? (
                  <div className="h-full shrink-0 overflow-y-auto overscroll-contain border-b border-slate-200 px-4 py-4 lg:px-6">
                    <div className="mx-auto flex max-w-3xl flex-col gap-6 pr-1">
                      <div className="border-b border-slate-200 pb-4">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`mailto:${selectedService.provider_email}`}
                            className="inline-flex items-center justify-center rounded-md bg-[#4c8cc9] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3d77b6]"
                          >
                            Contact
                          </a>
                          {selectedService?.link ? 
                          <a
                            href={selectedService?.link}
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-md bg-[#4c8cc9] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3d77b6]"
                          >
                            Register
                          </a>
                          : null}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setPanelView("map")
                              setSelectedServiceId(null);
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
                          >
                            Back to map
                          </button>
                        </div>

                        <div className="mt-4 flex min-w-0 items-start gap-3">
                          {selectedService.providerDetails?.id ? (
                            <Link
                              href={`/providers/${selectedService.providerDetails.id}`}
                              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white transition-opacity hover:opacity-80"
                            >
                              <img
                                src={selectedService.providerDetails?.logo || "/icons/Just_BIRD_logo_white.png"}
                                alt={selectedServiceProvider}
                                className="h-full w-full object-contain p-1.5"
                              />
                            </Link>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                              <img
                                src={selectedService.providerDetails?.logo || "/icons/Just_BIRD_logo_white.png"}
                                alt={selectedServiceProvider}
                                className="h-full w-full object-contain p-1.5"
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            {selectedService.providerDetails?.id ? (
                              <Link
                                href={`/providers/${selectedService.providerDetails.id}`}
                                className="block truncate text-sm font-medium text-slate-700 hover:text-sky-700 hover:underline"
                              >
                                {selectedServiceProvider}
                              </Link>
                            ) : (
                              <p className="truncate text-sm font-medium text-slate-700">{selectedServiceProvider}</p>
                            )}
                            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                              {selectedService.name}
                            </h2>
                            <p className="mt-2 text-xs text-slate-500">
                              {formatRelativeUpdateDate(selectedService.last_modified)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <section>
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Service Details</h3>
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <span>
                              <span className="font-bold">Location:</span>{" "}
                              {selectedServiceGoogleMapsUrl ? (
                                <a
                                  href={selectedServiceGoogleMapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700"
                                >
                                  {selectedServiceLocation}
                                </a>
                              ) : (
                                selectedServiceLocation
                              )}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <span><span className="font-bold">Languages:</span> {selectedServiceLanguages}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                              <span className="font-bold">Service Types:</span>
                              {selectedService.service_types
                                ? selectedService.service_types.split(", ").map((serviceType) => (
                                    <span
                                      key={serviceType}
                                      className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                                    >
                                      {serviceType}
                                    </span>
                                  ))
                                : null}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">About the Service</h3>
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{selectedServiceDescription}</p>
                        </div>
                      </section>

                      <section className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Location Details</h3>
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                          {selectedServiceMapEmbedUrl ? (
                            <div>
                              <div className="overflow-hidden rounded-xl border border-slate-200">
                                <iframe
                                  key={selectedServiceMapEmbedUrl}
                                  src={selectedServiceMapEmbedUrl}
                                  title={`Map showing the location of ${selectedServiceProvider}`}
                                  className="h-80 w-full"
                                  style={{ border: 0 }}
                                  loading="lazy"
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500">
                                <span>
                                  ©{" "}
                                  <a
                                    href="https://www.openstreetmap.org/copyright"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline hover:text-sky-700"
                                  >
                                    OpenStreetMap
                                  </a>{" "}
                                  contributors
                                </span>
                                {selectedServiceGoogleMapsUrl ? (
                                  <a
                                    href={selectedServiceGoogleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-slate-700 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700"
                                  >
                                    {selectedServiceLocation}
                                  </a>
                                ) : (
                                  <span className="font-medium text-slate-700">{selectedServiceLocation}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#eef4ea_0%,#f7f3ee_42%,#e9eef4_100%)] px-6 text-center text-sm text-slate-600">
                              <div className="max-w-sm">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4c8cc9] shadow-sm">
                                  <MapPinned size={22} />
                                </div>
                                {selectedServiceGoogleMapsUrl ? (
                                  <a
                                    href={selectedServiceGoogleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-block font-medium text-slate-700 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700"
                                  >
                                    {selectedServiceLocation}
                                  </a>
                                ) : (
                                  <p className="mt-3 font-medium text-slate-700">{selectedServiceLocation}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>                
                    </div>
                  </div>
                ) : null}

                <div className={isDescriptionView ? "hidden" : "flex-1 min-h-0 px-0 py-0"}>
                  <div className="mx-auto flex h-full max-w-3xl min-h-0 flex-col justify-center px-0 py-0">
                    <div className="relative h-[90%] w-full overflow-hidden rounded-[10px] border border-slate-200 bg-slate-50 shadow-sm">
                      <div ref={mapContainerRef} className="absolute inset-0 w-full" />

                      {!loading && !error && !filteredServices.some((service) => providerCoordinates[getProviderRecordId(service)]) ? (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 px-6 text-center">
                          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
                            The map is waiting for provider locations to resolve. If a location is missing,
                            the service still appears in the list.
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}