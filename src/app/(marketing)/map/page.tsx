"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import Sidebar from "@/components/marketing/Sidebar";
import { ChevronDown, LoaderCircle, MapPinned, Search, X } from "lucide-react";

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

function formatRelativeUpdateDate(value?: string) {
  if (!value) {
    return "Updated recently";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Updated recently";
  }

  const elapsedDays = Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return "Updated today";
  }

  if (elapsedDays === 1) {
    return "Updated 1 day ago";
  }

  return `Updated ${elapsedDays} days ago`;
}

function formatRelativeUpdateDateShort(value?: string) {
  if (!value) {
    return "Recent";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Recent";
  }

  const elapsedDays = Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return "Today";
  }

  if (elapsedDays === 1) {
    return "1 day ago";
  }

  return `${elapsedDays} days ago`;
}

const geocodeCache = new Map<string, Coordinates | null>();

function normalizeText(value: string | undefined) {
  return (value ?? "").toLowerCase().trim();
}

function parseCoordinatesFromGoogleMapsLink(link: string) {
  const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) } satisfies Coordinates;
  }

  const queryMatch = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) } satisfies Coordinates;
  }

  return null;
}

async function geocodeAddress(address: string) {
  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    return null;
  }

  const cached = geocodeCache.get(normalizedAddress);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalizedAddress)}`
    );

    if (!response.ok) {
      geocodeCache.set(normalizedAddress, null);
      return null;
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const coordinates = results[0]
      ? {
          lat: Number.parseFloat(results[0].lat),
          lng: Number.parseFloat(results[0].lon),
        }
      : null;

    geocodeCache.set(normalizedAddress, coordinates);
    return coordinates;
  } catch {
    geocodeCache.set(normalizedAddress, null);
    return null;
  }
}

function matchesSearch(service: ServiceWithProvider, query: string) {
  if (!query) {
    return true;
  }

  const provider = service.providerDetails;
  const haystack = [
    service.name,
    service.description,
    service.service_types,
    service.provider,
    provider?.name,
    provider?.description,
    provider?.address,
    provider?.services,
    provider?.language_support?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function MapPage() {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("All Providers");
  const [languageFilter, setLanguageFilter] = useState("Any Language");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [openFilterMenu, setOpenFilterMenu] = useState<"provider" | "language" | "status" | null>(null);
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

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [servicesResponse, providersResponse] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/providers"),
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
    };
  }, []);

  const providerByRecordId = useMemo(() => {
    return new Map(providers.map((provider) => [provider.id, provider]));
  }, [providers]);

  const providerOptions = useMemo(() => {
    return ["All Providers", ...providers.map((provider) => provider.name).filter(Boolean).sort((left, right) => left.localeCompare(right))];
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

    return ["Any Language", ...Array.from(uniqueLanguages).sort((left, right) => left.localeCompare(right))];
  }, [providers]);

  const statusOptions = useMemo(() => {
    return ["All Statuses", "Open", "Contact Provider", "Waitlist", "Closed"];
  }, []);

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
      const matchesProvider = providerFilter === "All Providers" || providerName === providerFilter;
      const matchesLanguage =
        languageFilter === "Any Language" ||
        serviceLanguages.includes(languageFilter) ||
        serviceLanguages.includes("All Languages");
      const matchesStatus = statusFilter === "All Statuses" || service.status === statusFilter;

      return matchesSearch(service, normalizedSearch) && matchesProvider && matchesLanguage && matchesStatus;
    });
  }, [languageFilter, providerFilter, search, servicesWithProviders, statusFilter]);

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
    let cancelled = false;

    async function resolveCoordinates() {
      const entries = await Promise.all(
        providers.map(async (provider) => {
          const fromLink = parseCoordinatesFromGoogleMapsLink(provider.google_maps_link);
          const coordinates = fromLink ?? (await geocodeAddress(`${provider.address}, Boston, MA`));
          return [provider.id, coordinates] as const;
        })
      );

      if (cancelled) {
        return;
      }

      setProviderCoordinates(Object.fromEntries(entries));
    }

    resolveCoordinates();

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
            <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${service.name}</div>
            <div style="font-size:12px;color:#475569;margin-bottom:6px;">${providerName}</div>
            <div style="font-size:12px;color:#334155;margin-bottom:6px;">${serviceSummary}</div>
            <div style="font-size:11px;color:#64748b;">${location}</div>
            <div style="font-size:11px;color:#64748b;">${languages}</div>
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

  const selectedServiceLocation = selectedService?.providerDetails?.address?.split(",")[0] || "Location unavailable";
  const selectedServiceLanguages = selectedService?.providerDetails?.language_support?.join(", ") || "Language support varies";
  const selectedServiceProvider = selectedService?.providerDetails?.name || "Provider unavailable";
  const isDescriptionView = panelView === "description" && Boolean(selectedService);
  const activeLanguageFilter = languageFilter !== "Any Language" ? languageFilter : null;

  useEffect(() => {
    if (!providerOptions.includes(providerFilter)) {
      setProviderFilter("All Providers");
    }
  }, [providerFilter, providerOptions]);

  useEffect(() => {
    if (!languageOptions.includes(languageFilter)) {
      setLanguageFilter("Any Language");
    }
  }, [languageFilter, languageOptions]);

  useEffect(() => {
    if (!statusOptions.includes(statusFilter)) {
      setStatusFilter("All Statuses");
    }
  }, [statusFilter, statusOptions]);

  const filterButtons = [
    {
      key: "provider" as const,
      label: "Provider",
      defaultValue: "All Providers",
      value: providerFilter,
      options: providerOptions,
      onSelect: setProviderFilter,
    },
    {
      key: "language" as const,
      label: "Languages",
      defaultValue: "Any Language",
      value: languageFilter,
      options: languageOptions,
      onSelect: setLanguageFilter,
    },
    {
      key: "status" as const,
      label: "Status",
      defaultValue: "All Statuses",
      value: statusFilter,
      options: statusOptions,
      onSelect: setStatusFilter,
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
      <Sidebar isOpen={true} activePage="Search Resources" />

      <main className="ml-55 flex min-h-dvh flex-1 bg-[#f2f4f7] px-3 py-2 text-slate-800">
        <section className="mx-auto flex min-h-[calc(100dvh-1rem)] flex-1 flex-col rounded-[28px] bg-[#f8fafc] px-4 py-4 shadow-[0_0_0_1px_rgba(229,231,235,0.9)]">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-4 xl:max-w-136">
              <div className="space-y-2">
                <h1 className="text-[1.8rem] font-semibold tracking-tight text-[#4c8cc9] sm:text-[2.1rem]">
                  Search Resources
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#a8d0e6] bg-white px-4 py-3 shadow-sm">
                  <Search size={16} className="shrink-0 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
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

                {filterButtons.map((filter) => {
                  const isOpen = openFilterMenu === filter.key;

                  return (
                    <div key={filter.key} className="relative" data-filter-menu-root>
                      <button
                        type="button"
                        onClick={() => setOpenFilterMenu(isOpen ? null : filter.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium shadow-sm transition-colors cursor-pointer ${
                            filter.value === filter.defaultValue
                            ? "border-[#a8d0e6] bg-white text-slate-700"
                            : "border-sky-200 bg-[#f7fbff] text-sky-800"
                        }`}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                      >
                          <span>{filter.value === filter.defaultValue ? filter.label : filter.value}</span>
                        <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                      </button>

                      {isOpen ? (
                        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                          <div className="max-h-72 overflow-y-auto p-2">
                            {filter.options.map((option) => {
                              const isActive = filter.value === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    filter.onSelect(option);
                                    setOpenFilterMenu(null);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                                    isActive ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{option}</span>
                                  {isActive ? <span className="text-xs font-semibold uppercase tracking-wide">Selected</span> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[24px] bg-white p-0">
                <div className=" space-y-4 overflow-y-auto pr-1 xl:h-[calc(100vh-12rem)]">
                  {loading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                      <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
                      Loading services
                    </div>
                  ) : error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                      No services matched your search.
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const provider = service.providerDetails;
                      const languageList = provider?.language_support || [];
                      const visibleLanguages = activeLanguageFilter && languageList.includes(activeLanguageFilter)
                        ? [activeLanguageFilter, ...languageList.filter((language) => language !== activeLanguageFilter)]
                        : languageList;
                      const languages = visibleLanguages.join(", ") || "Not listed";
                      const location = provider?.address?.split(",")[0] || "Location unavailable";
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
                          className={`flex h-32 w-full rounded-[22px] border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                            isSelected ? "border-sky-200 bg-[#f7fbff] ring-1 ring-sky-100" : "border-slate-200"
                          }`}
                        >
                          <div className="flex h-full w-full gap-4">
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
                                  className={`mt-1 h-4 shrink-0 rounded-xs text-xs px-1 ${
                                    service.status === "Open"
                                      ? "bg-green-500"
                                      : service.status === "Closed"
                                        ? "bg-rose-500"
                                        : service.status === "Waitlist"
                                          ? "bg-[#e69b00]"
                                          : service.status === "Contact Provider"
                                            ? "bg-[#abf7b1]"
                                            : "bg-slate-300"
                                  }`}>
                                {service.status}
                                </p>
                              </div>
                              
                              <div className="mt-auto space-y-1 pt-3 text-[0.72rem] text-slate-500">
                                <p className="font-medium text-slate-900">
                                  {languages}
                                </p>
                                <p>
                                  {location} · {formatRelativeUpdateDateShort(service.last_modified)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex p-4 min-h-112 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] xl:sticky xl:top-4 xl:h-[calc(100vh-3.5rem)]">

              <div className="flex min-h-0 flex-1 flex-col bg-white">
                {isDescriptionView && selectedService ? (
                  <div className="h-full shrink-0 overflow-y-auto overscroll-contain border-b border-slate-200 px-4 py-4 lg:px-6">
                    <div className="mx-auto flex max-w-3xl flex-col gap-6 pr-1">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={selectedService.providerDetails?.logo || "/icons/Just_BIRD_logo_white.png"}
                              alt={selectedServiceProvider}
                              className="h-full w-full object-contain p-1.5"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">{selectedServiceProvider}</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                              {selectedService.name}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                              {formatRelativeUpdateDate(selectedService.last_modified)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
                      </div>

                      <section>
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Class details</h3>
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <span><span className="font-bold">Languages:</span> {selectedServiceLanguages}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <span><span className="font-bold">Location:</span> {selectedServiceLocation}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-slate-400">◦</span>
                            <span><span className="font-bold">Service Types:</span> {selectedService.service_types}</span>
                          </div>
                        </div>
                      </section>

                      <section className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">About the Service</h3>
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                          <p className="text-sm leading-7 text-slate-700">{selectedServiceDescription}</p>
                        </div>
                      </section>

                      <section className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Location Details</h3>
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                          <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#eef4ea_0%,#f7f3ee_42%,#e9eef4_100%)] px-6 text-center text-sm text-slate-600">
                            <div className="max-w-sm">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4c8cc9] shadow-sm">
                                <MapPinned size={22} />
                              </div>
                              <p className="mt-3 font-medium text-slate-700">{selectedServiceLocation}</p>
                              {selectedService.providerDetails?.google_maps_link ? (
                                <a
                                  href={selectedService.providerDetails.google_maps_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                                >
                                  Open in Google Maps
                                </a>
                              ) : null}
                            </div>
                          </div>
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