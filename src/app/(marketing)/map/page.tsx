"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import Sidebar from "@/components/marketing/Sidebar";
import { DropdownPanel } from "@/components/marketing/DropdownPanel";
import { matchesLanguageFilter } from "@/lib/language-filter";
import { ChevronDown, List, LoaderCircle, MapPin, MapPinned, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { buildProviderSummaryBase, createElement as createPopupElement } from "@/components/marketing/map-popup-dom";
import { Input } from "@/components/ui/input";
import { SelectAllButton, canSelectMore } from "@/components/ui/select-all-button";
import { formatRelativeUpdateDate } from "@/lib/dates";
import { buildOpenStreetMapEmbedUrl } from "@/lib/openstreetmap";
import { getCustomHistoryValue, updateSearchParams, useUrlList, useUrlText, useUrlValue } from "@/lib/url-state";

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

function getReadableTextColor(rgbString: string): string {
  const match = rgbString.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#1e293b";
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}

// Pop-up for a pin: the provider summary shared with the Providers page (logo, linked name, address, phone, email,
// languages) followed by the provider's services. Each service opens in the details panel. Built with DOM APIs, so
// provider and service names can never be interpreted as markup.
function buildProviderPopup(
  provider: Provider | undefined,
  services: ServiceWithProvider[],
  onSelectService: (serviceId: string) => void,
  maxHeight: number,
  width: number,
): HTMLElement {
  const summary = provider
    ? buildProviderSummaryBase(provider)
    : createPopupElement("div", "font-family:Arial, sans-serif;font-size:12px;color:#334155;");

  if (!provider) {
    summary.append(createPopupElement("div", "font-weight:700;font-size:13px;color:#0f172a;", "Provider unavailable"));
  }

  const list = createPopupElement("div", "margin-top:8px;");
  for (const service of services) {
    const link = document.createElement("a");
    link.href = "#";
    link.dataset.serviceId = service.id;
    link.textContent = service.name;
    link.style.cssText =
      "display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#0284c7;text-decoration:underline;margin-top:4px;";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      onSelectService(service.id);
    });
    list.append(link);
  }
  summary.append(list);

  // Long lists (many services) scroll inside the pop-up instead of growing past the map.
  const scroller = createPopupElement("div", `max-height:${maxHeight}px;overflow-y:auto;`);
  scroller.append(summary);
  const content = createPopupElement("div", `width:${width}px;max-width:100%;`);
  content.append(scroller);
  return content;
}

type NarrowView = "list" | "map";

// The List / Map switch for screens too narrow to show both side by side. The labelled version is used from sm up. Phones get
// an icon-only version so that it can share a row with the search box.
function ViewToggle({
  value,
  onChange,
  iconOnly = false,
  className,
}: {
  value: NarrowView;
  onChange: (view: NarrowView) => void;
  iconOnly?: boolean;
  className: string;
}) {
  return (
    <div role="group" aria-label="View" className={className}>
      {(
        [
          { view: "list", label: "List", Icon: List },
          { view: "map", label: "Map", Icon: MapPin },
        ] as const
      ).map(({ view, label, Icon }) => (
        <button
          key={view}
          type="button"
          onClick={() => onChange(view)}
          aria-pressed={value === view}
          aria-label={iconOnly ? `${label} view` : undefined}
          title={iconOnly ? `${label} view` : undefined}
          className={`flex flex-1 items-center justify-center rounded-md transition-colors cursor-pointer md:flex-none ${
            iconOnly ? "px-3 py-2" : "gap-1.5 px-4 py-2 text-sm font-medium"
          } ${value === view ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
        >
          <Icon size={16} aria-hidden="true" />
          {iconOnly ? null : label}
        </button>
      ))}
    </div>
  );
}

const SORT_OPTIONS = [
  "providerName-asc",
  "providerName-desc",
  "serviceName-asc",
  "serviceName-desc",
  "lastUpdated-asc",
  "lastUpdated-desc",
  "status-asc",
  "status-desc",
] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const NARROW_VIEWS = ["list", "map"] as const;

// Opening a service's details adds a history entry (so that Back closes them), and leaves this in its state. That is how Close can
// tell, even after the page has been reloaded, whether to go Back, or whether the page was opened with the details already showing
// (from a shared link, say), when going Back would leave the page.
const SERVICE_DETAILS_HISTORY_KEY = "serviceDetailsOpenedHere";

// The search, the filters, the sort, the list/map view and the service whose details are open are all kept in the address
// (?q=...&language=...&sort=...&view=map&service=...), so that this page can be bookmarked or shared, and Back brings it back as it was.
// Changing the search, a filter, the sort or the view replaces the current history entry, so Back still leaves the page in one step.
// Opening a service's details adds one, so Back closes them.
function MapPageContent() {
  const { text: search, setText: setSearch, commit: commitSearch, reset: resetSearch, clear: clearSearch } = useUrlText("q");

  const [openFilterMenu, setOpenFilterMenu] = useState<"provider" | "language" | "serviceType" | "status" | "sort" | null>(null);
  const [sortOption, setSortOption] = useUrlValue<SortOption>("sort", SORT_OPTIONS, "lastUpdated-desc");
  const [filterSearchText, setFilterSearchText] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const selectedServiceId = searchParams.get("service");
  const panelView: "map" | "description" = selectedServiceId ? "description" : "map";
  // Below the xl breakpoint the list and the map don't fit side by side, so only one shows at a time and this picks which.
  // From xl up both always show and this has no effect.
  const [narrowView, setNarrowView] = useUrlValue<NarrowView>("view", NARROW_VIEWS, "list");
  const [statusColors, setStatusColors] = useState<Record<string, string>>({});
  const [providerCoordinates, setProviderCoordinates] = useState<Record<string, Coordinates | null>>({});
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  // Fitting the map to its markers, put off until the map has a size to fit them into (see the effect that draws the markers).
  const pendingFitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [servicesResponse, providersResponse, statusColorsResponse] = await Promise.all([
          fetch("/api/services", { signal: abortController.signal }),
          fetch("/api/providers", { signal: abortController.signal }),
          fetch("/api/service-status-colors", { signal: abortController.signal }),
        ]);

        if (!servicesResponse.ok || !providersResponse.ok) {
          throw new Error("Failed to load map data");
        }

        const [servicesData, providersData] = (await Promise.all([
          servicesResponse.json(),
          providersResponse.json(),
        ])) as [Service[], Provider[]];

        // Status colors are a visual nicety, not core map data — a failure
        // here shouldn't block the page, so this is checked separately rather
        // than thrown into the same "Failed to load map data" error above.
        const statusColorsData = statusColorsResponse.ok
          ? ((await statusColorsResponse.json()) as Record<string, string>)
          : {};

        if (!active) {
          return;
        }

        setServices(servicesData);
        setProviders(providersData);
        setStatusColors(statusColorsData);
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

  // Anything in the address that isn't one of the options (from a bookmark made before one was removed, or typed in) is ignored.
  const [providerFilter, setProviderFilter] = useUrlList("provider", providerOptions);
  const [languageFilter, setLanguageFilter] = useUrlList("language", languageOptions);
  const [serviceTypeFilter, setServiceTypeFilter] = useUrlList("serviceType", serviceTypeOptions);
  const [statusFilter, setStatusFilter] = useUrlList("status", statusOptions);

  const hasActiveSearchOrFilters =
    search.trim().length > 0 ||
    providerFilter.length > 0 ||
    languageFilter.length > 0 ||
    serviceTypeFilter.length > 0 ||
    statusFilter.length > 0;

  function handleClearAll() {
    resetSearch();
    updateSearchParams((params) => {
      for (const name of ["q", "provider", "language", "serviceType", "status"]) {
        params.delete(name);
      }
    });
  }

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
      const matchesLanguage = matchesLanguageFilter(languageFilter, serviceLanguages);
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

  // Opening a service's details adds a history entry, so that Back closes them. Going from one service to another while they are
  // open replaces it, so Back still closes them in one step.
  const openService = useCallback((serviceId: string) => {
    const detailsAreOpen = new URLSearchParams(window.location.search).has("service");

    updateSearchParams(
      (params) => params.set("service", serviceId),
      detailsAreOpen ? {} : { push: true, state: { [SERVICE_DETAILS_HISTORY_KEY]: true } },
    );
  }, []);

  // If this page added the history entry the details are in, closing them goes Back, which leaves no entry behind that would only
  // reopen them with Forward. Otherwise (the page was opened with them showing) going Back would leave the page, so the service is
  // taken out of the address instead.
  const closeService = useCallback(() => {
    if (getCustomHistoryValue(SERVICE_DETAILS_HISTORY_KEY)) {
      window.history.back();
      return;
    }

    updateSearchParams((params) => params.delete("service"));
  }, []);

  // A service in the address that isn't in the results can't be shown, so it is taken out of the address. (Not before the data has
  // loaded: until then there are no results at all, and a link to a service would lose it.)
  useEffect(() => {
    if (!loading && selectedServiceId && !selectedService) {
      updateSearchParams((params) => params.delete("service"));
    }
  }, [loading, selectedService, selectedServiceId]);

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

    const locationsByProvider = new Map<string, { coordinates: Coordinates; services: ServiceWithProvider[] }>();
    for (const service of filteredServices) {
      const providerId = getProviderRecordId(service);
      const coordinates = providerCoordinates[providerId];
      if (!coordinates) continue;

      const existing = locationsByProvider.get(providerId);
      if (existing) {
        existing.services.push(service);
      } else {
        locationsByProvider.set(providerId, { coordinates, services: [service] });
      }
    }
    const visibleLocations = Array.from(locationsByProvider.values());

    markerLayer.clearLayers();
    pendingFitRef.current = null;

    (async () => {
      const leafletModule = (await import("leaflet")) as typeof import("leaflet");
      const L = leafletModule;

      const markers = visibleLocations.map(({ services, coordinates }) => {
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

        const provider = services[0]?.providerDetails;

        marker.bindPopup(
          () =>
            buildProviderPopup(
              provider,
              services,
              openService,
              // Sized to the map as it is when the pop-up opens: the content box plus Leaflet's padding and arrow (about 60px)
              // must fit inside the map, which is shorter than the window because the search and filters sit above it.
              Math.min(480, Math.max(160, map.getSize().y - 64)),
              // 280px wide where there's room. On a narrow phone the pop-up shrinks to fit inside the map: Leaflet adds about
              // 47px of its own padding around the content, plus a few pixels it keeps clear of the map's edge.
              Math.max(200, Math.min(280, map.getSize().x - 58)),
            ),
          { minWidth: 200, maxWidth: 300 },
        );

        markerLayer.addLayer(marker);

        return { coordinates };
      });

      if (!markers.length) {
        return;
      }

      const fitToMarkers = () => {
        // Leaflet remembers the size the map had when it was last measured, which is 0 if that was while it was hidden (the details
        // being open, say), and fits into that size, however big the map is now. So it measures it again first.
        map.invalidateSize({ animate: false, pan: false });

        if (markers.length === 1) {
          map.setView([markers[0].coordinates.lat, markers[0].coordinates.lng], 12, {
            animate: true,
          });
          return;
        }

        const bounds = L.latLngBounds(markers.map((entry) => [entry.coordinates.lat, entry.coordinates.lng] as [number, number]));
        map.fitBounds(bounds.pad(0.18), { animate: true });
      };

      // While the service details are open the map is hidden, and has no size. Fitting the markers into no size zooms all the way out,
      // to the whole world, and that is how the map would look when the details are closed again. So when the map can't be seen, the
      // fit waits until it can (the effect on isDescriptionView below does it).
      const container = map.getContainer();
      if (!container.clientWidth || !container.clientHeight) {
        pendingFitRef.current = fitToMarkers;
        return;
      }

      fitToMarkers();
    })();
  }, [filteredServices, mapReady, openService, providerCoordinates]);

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
      onSelect: setProviderFilter,
    },
    {
      key: "language" as const,
      label: "Languages",
      value: languageFilter,
      options: languageOptions,
      onToggle: (option: string) => toggleFilterValue(setLanguageFilter, option),
      onSelect: setLanguageFilter,
    },
    {
      key: "serviceType" as const,
      label: "Service Type",
      value: serviceTypeFilter,
      options: serviceTypeOptions,
      onToggle: (option: string) => toggleFilterValue(setServiceTypeFilter, option),
      onSelect: setServiceTypeFilter,
    },
    {
      key: "status" as const,
      label: "Status",
      value: statusFilter,
      options: statusOptions,
      onToggle: (option: string) => toggleFilterValue(setStatusFilter, option),
      onSelect: setStatusFilter,
    },
  ];

  // When the map shows again (the details closed), it needs to measure itself, and then do any fit that had to wait for that.
  useEffect(() => {
    if (isDescriptionView || !mapRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();

      const pendingFit = pendingFitRef.current;
      pendingFitRef.current = null;
      pendingFit?.();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isDescriptionView]);

  return (
    <div className="flex min-h-dvh items-stretch bg-slate-100 p-0 m-0">
      <Sidebar isOpen={true} activePage="Search Services" />

      {/* Phones (below sm) get a 16px margin on every side. The gap under the fixed header is the shared 4.5rem offset (16px below the
          3.5rem header), so it needs no override there; from sm up the margins are as they were. */}
      <main className="ml-55 flex min-h-dvh flex-1 overflow-hidden bg-[#f2f4f7] px-4 pb-4 text-slate-800 sm:px-3 sm:py-2 sm:[--mobile-header-offset:4rem]">
        {/* Layout only (the page's height and maximum width). It has no background, border or corners of its own.
            The height is the screen minus whatever the page spends above and below the content: on a phone that's the 4.5rem
            header offset plus 1rem of bottom padding (5.5rem), from sm up the 4rem offset plus 0.5rem (4.5rem), and from md
            just the 1rem of padding. If those margins change, change this to match, or the page will scroll or leave a gap. */}
        <section className="mx-auto flex h-[calc(100dvh-5.5rem)] w-full max-w-400 flex-col gap-2 overflow-hidden sm:h-[calc(100dvh-4.5rem)] sm:gap-3 sm:px-4 sm:py-4 md:h-[calc(100dvh-1rem)]">
          <div className="relative z-30 space-y-2 border-slate-200 sm:space-y-3 sm:border-b sm:pb-3">
            <div className="hidden items-center justify-between gap-2 sm:flex">
              <h1 className="hidden text-2xl font-semibold tracking-tight text-[#4c8cc9] md:block">
                Search Services
              </h1>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-3 md:flex-none">
                {/* List / Map switch for screens too narrow to show both (hidden from xl up, where they sit side by side).
                    Full-width below md, compact beside the title from md up. On a phone this row is hidden and an icon-only
                    switch sits next to the search box instead. */}
                <ViewToggle
                  value={narrowView}
                  onChange={setNarrowView}
                  className="hidden min-w-0 flex-1 items-center rounded-lg border border-[#a8d0e6] bg-white p-0.5 shadow-sm sm:flex md:flex-none xl:hidden"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 xl:flex-row xl:items-center">
              {/* On a phone the List / Map switch shares a row with the search box, to its right. From sm up this wrapper is
                  display: contents, so the search box is laid out exactly as it always was. */}
              <div className="flex items-stretch gap-2 sm:contents">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#a8d0e6] bg-white px-3 py-2 shadow-sm sm:px-3.5 xl:max-w-[560px]">
                  <Search size={16} className="shrink-0 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onBlur={commitSearch}
                    placeholder="Search services by name or keywords"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 max-sm:text-ellipsis"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <ViewToggle
                  value={narrowView}
                  onChange={setNarrowView}
                  iconOnly
                  className="flex shrink-0 items-center rounded-lg border border-[#a8d0e6] bg-white p-0.5 shadow-sm sm:hidden"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 self-start sm:gap-2 xl:self-auto xl:justify-end">
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
                    <div key={filter.key} className="min-w-0 sm:relative sm:z-50" data-filter-menu-root>
                      <button
                        type="button"
                        onClick={() => setOpenFilterMenu(isOpen ? null : filter.key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-2 text-xs font-medium shadow-sm transition-colors cursor-pointer sm:px-3.5 sm:text-sm ${
                          selectedCount === 0
                            ? "border-[#a8d0e6] bg-white text-slate-700"
                            : "border-sky-200 bg-[#f7fbff] text-sky-800"
                        }`}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="truncate">{buttonLabel}</span>
                        <ChevronDown size={14} className={isOpen ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
                      </button>

                      {isOpen ? (
                        <DropdownPanel
                          preferredSide={filter.key === "serviceType" || filter.key === "status" ? "right" : "left"}
                          placementKey={buttonLabel}
                          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:w-max sm:min-w-60 sm:max-w-96 ${
                            filter.key === "serviceType" || filter.key === "status" ? "sm:left-auto sm:right-0" : "sm:left-0 sm:right-auto"
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
                          {selectedCount > 0 || canSelectMore(visibleOptions, filter.value) ? (
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-100 px-3 py-1.5">
                              <SelectAllButton
                                options={filter.options}
                                visibleOptions={visibleOptions}
                                selected={filter.value}
                                onSelect={filter.onSelect}
                                className="rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-700 hover:bg-sky-50 cursor-pointer"
                              />
                              {selectedCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (filter.key === "provider") setProviderFilter([]);
                                    else if (filter.key === "language") setLanguageFilter([]);
                                    else if (filter.key === "serviceType") setServiceTypeFilter([]);
                                    else setStatusFilter([]);
                                  }}
                                  className="ml-auto rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-700 hover:bg-sky-50 cursor-pointer"
                                >
                                  Clear ({selectedCount})
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="max-h-72 overflow-y-auto p-2">
                            {visibleOptions.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-slate-400">No matches.</p>
                            ) : (
                              visibleOptions.map((option) => {
                                const isActive = filter.value.includes(option);
                                const wrapsText = filter.key === "provider" || filter.key === "serviceType";
                                return (
                                  <label
                                    key={option}
                                    className={`flex w-full min-w-0 cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                      wrapsText ? "items-start" : "items-center"
                                    } ${isActive ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50"}`}
                                  >
                                    <Checkbox checked={isActive} onCheckedChange={() => filter.onToggle(option)} className={wrapsText ? "mt-0.5 shrink-0" : "shrink-0"} />
                                    <span className={wrapsText ? "min-w-0 break-words" : "min-w-0 truncate"}>{option}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </DropdownPanel>
                      ) : null}
                    </div>
                  );
                })}

                {/* Clear All sits to the right of the filters on every screen size, since it clears them (and the search). It is pushed
                    to the right (ml-auto) inside a row that is only as wide as its contents (self-start), so there is nothing to push
                    into while everything fits on one line, and it sits right beside the last filter. When the row has to wrap, it is
                    full width, and Clear All goes to the right edge, on a line of its own if the filters filled the last one. */}
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
            </div>
          </div>

          <div
            className={`relative grid min-h-0 flex-1 gap-4 overflow-hidden xl:z-0 xl:grid-cols-[minmax(360px,430px)_1fr] ${
              isDescriptionView ? "z-[35]" : "z-0"
            }`}
          >
            {/* Below xl the list and the map are stacked on top of each other and the inactive one is made invisible rather
                than display:none. That keeps both laid out at their real size, so the map still fits its pins and the
                list keeps its scroll position when the user switches back and forth. */}
            <div
              className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-[#a8d0e6] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] max-xl:absolute max-xl:inset-0 ${
                narrowView === "map" ? "max-xl:invisible" : ""
              }`}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 sm:px-4 sm:py-3">
                <p className="min-w-0 truncate text-sm text-slate-500">
                  Showing {sortedFilteredServices.length} of {services.length}
                </p>

                <div className="relative z-50 min-w-0 shrink" data-filter-menu-root>
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
                          className="flex w-full min-w-0 items-center gap-1.5 rounded-full border border-[#a8d0e6] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors cursor-pointer sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                          aria-expanded={isOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="min-w-0 truncate">Sort: {currentLabel}</span>
                          <ChevronDown size={14} className={isOpen ? "shrink-0 rotate-180 transition-transform" : "shrink-0 transition-transform"} />
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

              <div className="h-full space-y-2 overflow-y-auto rounded-b-2xl pr-2">
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
                        onClick={() => openService(service.id)}
                        className={`flex w-full border bg-white p-3 pb-2.5 text-left shadow-sm sm:min-h-32 sm:p-4 sm:pb-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
                          isSelected ? "border-sky-200 bg-[#f7fbff] ring-1 ring-sky-100" : "border-slate-200"
                        }`}
                      >
                        {/* self-stretch: a <button> defaults to align-items: flex-start, so without it this wrapper wouldn't fill a card sitting at its minimum height. */}
                        <div className="flex w-full gap-2 self-stretch">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={provider?.logo || "/icons/Just_BIRD_logo_blue.png"}
                              alt={provider?.name ?? "Provider logo"}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            {/* The status pill shares the provider-name line, so the Service name below gets the card's full
                                width. A grid (rather than reordering the markup) keeps the reading order: provider, name, status. */}
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
                              <p className="truncate text-[0.72rem] text-slate-900">{providerName}</p>
                              <h2 className="col-span-2 row-start-2 break-words text-[1.05rem] font-semibold tracking-tight text-slate-900">
                                {service.name}
                              </h2>
                              <p
                                className="col-start-2 row-start-1 h-4 rounded-xs px-1 text-xs"
                                style={{
                                  backgroundColor: statusColors[service.status] || "#cbd5e1",
                                  color: getReadableTextColor(statusColors[service.status] || "#cbd5e1"),
                                }}
                              >
                                {service.status}
                              </p>
                            </div>

                            {/* The "Updated…" text sits at the card's bottom-right, on the languages line when it fits there and on its
                                own right-aligned line when it doesn't. mt-auto keeps it at the bottom of a taller card (from sm up, where cards
                                have a minimum height); on a phone cards are exactly as tall as their content. */}
                            <div className="mt-auto pt-1.5 text-[0.72rem] text-slate-500 sm:pt-3">
                              <p className="truncate">
                                {location}
                              </p>
                              <div className="mt-1 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                                <p className="font-medium text-slate-900">
                                  {languages}
                                </p>
                                <p className="ml-auto shrink-0 whitespace-nowrap">{formatRelativeUpdateDate(service.last_modified)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#a8d0e6] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] max-xl:absolute max-xl:inset-0 xl:h-full ${
                narrowView === "list" ? "max-xl:invisible" : ""
              }`}
            >

              <div className="flex min-h-0 flex-1 flex-col bg-white">
                {isDescriptionView && selectedService ? (
                  // `visible` because this panel is invisible while the list is showing, and the details open from the list too.
                  // From md up the sidebar (w-55, always showing there) sits on top of this overlay, so the overlay starts at the sidebar's
                  // right edge (md:left-55) instead of the window's, or the left 220px of the details would be hidden behind it.
                  <div className="@container visible fixed inset-x-0 top-14 bottom-0 z-[55] md:left-55 overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-4 py-4 xl:static xl:inset-auto xl:z-auto xl:h-full xl:shrink-0 xl:rounded-none xl:border-b xl:border-slate-200 lg:px-6">
                    {/* One column about 34rem wide: the description in it reads about 70 characters per line (it was over 90 at the old 48rem
                        width, and 80 is the most WCAG recommends). When the panel is wide enough (60rem and up, a container query on the
                        panel itself) and the details are inside the card next to the list (xl and up), the map moves into a second column
                        beside the facts and the description, so the extra width is used for more things side by side, not for longer
                        lines. Below xl the details are a full-screen overlay, and the sidebar covers its left 14rem, so a wider layout there
                        would only put more of it behind the sidebar. The header spans both columns, and the sections stay in the same
                        order in the page either way. */}
                    <div className="mx-auto flex max-w-[34rem] flex-col gap-6 pr-1 xl:@[60rem]:grid xl:@[60rem]:max-w-5xl xl:@[60rem]:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] xl:@[60rem]:items-start xl:@[60rem]:gap-x-10">
                      <div className="border-b border-slate-200 pb-4 xl:@[60rem]:col-span-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <a
                            href={`mailto:${selectedService.provider_email}`}
                            className="inline-flex items-center justify-center rounded-md bg-[#4c8cc9] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3d77b6]"
                          >
                            Email
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
                            onClick={closeService}
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
                          >
                            <span className="xl:hidden">{narrowView === "map" ? "Back To Map" : "Back To List"}</span>
                            <span className="hidden xl:inline">Back To Map</span>
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
                            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{selectedService.name}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                              {selectedService.status ? (
                                <span
                                  className="h-4 shrink-0 rounded-xs px-1 text-xs leading-4"
                                  style={{
                                    backgroundColor: statusColors[selectedService.status] || "#cbd5e1",
                                    color: getReadableTextColor(statusColors[selectedService.status] || "#cbd5e1"),
                                  }}
                                >
                                  {selectedService.status}
                                </span>
                              ) : null}
                              <span>{formatRelativeUpdateDate(selectedService.last_modified)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="contents xl:@[60rem]:flex xl:@[60rem]:flex-col xl:@[60rem]:gap-6">
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
                      </div>

                      <section className="border-t border-slate-200 pt-4 xl:@[60rem]:border-t-0 xl:@[60rem]:pt-0">
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

                {/* The map fills the whole card, edge to edge, at every window size: the card's own border and rounded corners (it clips
                    what is inside it) are the map's outline, so the map needs no frame, width limit or margin of its own. The one
                    exception is Leaflet's credit line in the bottom-right corner, which it places flush against the corner, where
                    the card's rounded corner would cut off its last letters, so it gets a small inset. */}
                <div
                  className={
                    isDescriptionView
                      ? "hidden"
                      : "relative min-h-0 flex-1 bg-slate-50 [&_.leaflet-bottom.leaflet-right]:mb-1.5 [&_.leaflet-bottom.leaflet-right]:mr-1.5"
                  }
                >
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
        </section>
      </main>
    </div>
  );
}

// useSearchParams needs a Suspense boundary on a page that is built ahead of time. This is what shows until the page has loaded, the
// sidebar and a spinner, so that nothing jumps when it does.
function MapPageFallback() {
  return (
    <div className="flex min-h-dvh items-stretch bg-slate-100 p-0 m-0">
      <Sidebar isOpen={true} activePage="Search Services" />
      <main className="ml-55 flex min-h-dvh flex-1 items-center justify-center bg-[#f2f4f7]">
        <LoaderCircle className="animate-spin text-slate-400" aria-label="Loading" />
      </main>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapPageFallback />}>
      <MapPageContent />
    </Suspense>
  );
}
