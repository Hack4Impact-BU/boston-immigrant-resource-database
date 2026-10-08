"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

import type { Provider } from "@/app/api/airtable";

type Coordinates = { lat: number; lng: number };
type LeafletModule = typeof import("leaflet");
type PinGroup = { key: string; coordinates: Coordinates; providers: Provider[] };

// Same starting view as the Search Services map.
const DEFAULT_CENTER: [number, number] = [42.361145, -71.057083];

// Same cap the Search Services page uses on simultaneous geocode requests.
const GEOCODE_BATCH_SIZE = 40;

// Providers saved since the switch to Google geocoding have stored coordinates. Older ones are looked up
// through the server route, which writes the result back to Airtable, so this only ever happens once per
// provider. These module-level maps keep results for the whole page session, so toggling the map off and
// on, or changing filters, never repeats a request.
const fallbackLookups = new Map<string, Promise<Coordinates | null>>();
const resolvedFallbacks = new Map<string, Coordinates | null>();

function lookupFallbackCoordinates(providerId: string): Promise<Coordinates | null> {
  let lookup = fallbackLookups.get(providerId);

  if (!lookup) {
    lookup = (async () => {
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
    })();
    fallbackLookups.set(providerId, lookup);
  }

  return lookup;
}

function getStoredCoordinates(provider: Provider): Coordinates | null {
  const { latitude, longitude } = provider;
  return typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { lat: latitude, lng: longitude }
    : null;
}

// ---- Popup content -------------------------------------------------------------------------------------
// Built with DOM APIs and textContent rather than an HTML string: provider names and descriptions are
// editable by Provider users, and this way their text can never be interpreted as markup.

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, style: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.style.cssText = style;
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

const LINK_STYLE = "color:#0369a1;text-decoration:underline;overflow-wrap:anywhere;";

function createLabeledRow(label: string, content: Node): HTMLElement {
  const row = createElement("div", "margin-top:6px;line-height:1.4;");
  row.append(createElement("span", "color:#94a3b8;", `${label} `), content);
  return row;
}

function buildProviderSummary(provider: Provider): HTMLElement {
  const summary = createElement("div", "font-family:Arial, sans-serif;font-size:12px;color:#334155;");
  const profileHref = `/providers/${encodeURIComponent(provider.id)}`;

  const header = createElement("div", "display:flex;gap:10px;align-items:flex-start;");
  const logo = document.createElement("img");
  logo.src = provider.logo || "/icons/Just_BIRD_logo_blue.png";
  logo.alt = "";
  logo.loading = "lazy";
  logo.style.cssText = "width:40px;height:40px;flex-shrink:0;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;padding:2px;background:#fff;";
  header.append(logo);

  const heading = createElement("div", "min-width:0;");
  const name = document.createElement("a");
  name.href = profileHref;
  name.textContent = provider.name;
  name.style.cssText = "display:block;font-weight:700;font-size:13px;line-height:1.3;color:#0f172a;text-decoration:none;overflow-wrap:anywhere;";
  heading.append(name, createElement("div", "margin-top:2px;font-size:11px;color:#64748b;", provider.address || "Location not listed"));
  header.append(heading);
  summary.append(header);

  const phone = provider.primary_phone_number?.trim();
  if (phone) {
    const link = document.createElement("a");
    link.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    link.textContent = phone;
    link.style.cssText = LINK_STYLE;
    summary.append(createLabeledRow("Phone", link));
  }

  const email = provider.email?.trim();
  if (email) {
    const link = document.createElement("a");
    link.href = `mailto:${email}`;
    link.textContent = email;
    link.style.cssText = LINK_STYLE;
    summary.append(createLabeledRow("Email", link));
  }

  if (provider.language_support.length > 0) {
    summary.append(createLabeledRow("Languages", document.createTextNode(provider.language_support.join(" · "))));
  }

  if (provider.service_types?.trim()) {
    summary.append(createLabeledRow("Service types", document.createTextNode(provider.service_types.trim())));
  }

  if (provider.description?.trim()) {
    summary.append(
      createElement(
        "div",
        "margin-top:8px;line-height:1.45;color:#475569;display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;overflow:hidden;",
        provider.description.trim(),
      ),
    );
  }

  const profileLink = document.createElement("a");
  profileLink.href = profileHref;
  profileLink.textContent = "View full profile →";
  profileLink.style.cssText = `${LINK_STYLE}display:inline-block;margin-top:8px;font-weight:600;`;
  summary.append(profileLink);

  return summary;
}

// Providers that share a location (e.g. several organizations in one building) would otherwise be pins stacked
// exactly on top of each other, hiding all but one. They share a single pin whose popup lists each of them.
function buildPopupContent(group: Provider[]): HTMLElement {
  const content = createElement("div", "width:280px;max-width:100%;");

  if (group.length > 1) {
    content.append(createElement("div", "margin-bottom:8px;font-family:Arial, sans-serif;font-size:11px;font-weight:700;color:#64748b;", `${group.length} organizations at this location`));
  }

  const list = createElement("div", "max-height:300px;overflow-y:auto;");
  group.forEach((provider, index) => {
    const summary = buildProviderSummary(provider);
    if (index > 0) {
      summary.style.cssText += "margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;";
    }
    list.append(summary);
  });
  content.append(list);

  return content;
}

function buildPinIcon(L: LeafletModule, count: number) {
  const inner = count > 1 ? `<span style="color:white;font:700 12px Arial, sans-serif;">${count}</span>` : '<div style="width:10px;height:10px;border-radius:9999px;background:white;"></div>';

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#f97316;box-shadow:0 8px 18px rgba(15,23,42,0.18);border:3px solid white;">
        ${inner}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
}

// ---- Component -----------------------------------------------------------------------------------------

export default function ProvidersMap({ providers }: { providers: Provider[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mountedRef = useRef(false);
  const lastFitRef = useRef("");
  const hasFramedRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [resolved, setResolved] = useState<Record<string, Coordinates | null>>(() => Object.fromEntries(resolvedFallbacks));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Look up coordinates for providers that don't have them stored yet.
  useEffect(() => {
    const needing = providers.filter((provider) => getStoredCoordinates(provider) === null && !resolvedFallbacks.has(provider.id));

    if (needing.length === 0) {
      return;
    }

    let cancelled = false;

    (async () => {
      for (let start = 0; start < needing.length && !cancelled; start += GEOCODE_BATCH_SIZE) {
        await Promise.all(
          needing.slice(start, start + GEOCODE_BATCH_SIZE).map(async (provider) => {
            const coordinates = await lookupFallbackCoordinates(provider.id);
            resolvedFallbacks.set(provider.id, coordinates);

            if (mountedRef.current) {
              setResolved((previous) => ({ ...previous, [provider.id]: coordinates }));
            }
          }),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providers]);

  const { groups, missing, pending } = useMemo(() => {
    const byLocation = new Map<string, PinGroup>();
    let missingCount = 0;
    let pendingCount = 0;

    for (const provider of providers) {
      const coordinates = getStoredCoordinates(provider) ?? resolved[provider.id];

      if (coordinates === undefined) {
        pendingCount += 1;
      } else if (coordinates === null) {
        missingCount += 1;
      } else {
        const key = `${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`;
        const existing = byLocation.get(key);

        if (existing) {
          existing.providers.push(provider);
        } else {
          byLocation.set(key, { key, coordinates, providers: [provider] });
        }
      }
    }

    return { groups: Array.from(byLocation.values()), missing: missingCount, pending: pendingCount };
  }, [providers, resolved]);

  // Create the map.
  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const L = (await import("leaflet")) as LeafletModule;
      if (cancelled || !containerRef.current) {
        return;
      }

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(DEFAULT_CENTER, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      leafletRef.current = L;
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    }

    initializeMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        // Leaflet finishes a zoom animation on an internal 250ms timer that remove() doesn't cancel. If the map is torn
        // down mid-animation (e.g. switching views right after opening the map or changing a filter), that timer runs
        // against a map that no longer exists and throws. Clearing the flag it checks turns it into a harmless no-op.
        (mapRef.current as unknown as { _animatingZoom?: boolean })._animatingZoom = false;
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        leafletRef.current = null;
        lastFitRef.current = "";
        hasFramedRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  // Keep the pins in step with the current search and filters.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!mapReady || !L || !map || !layer) {
      return;
    }

    layer.clearLayers();

    for (const group of groups) {
      const names = group.providers.map((provider) => provider.name).join(", ");
      const marker = L.marker([group.coordinates.lat, group.coordinates.lng], {
        icon: buildPinIcon(L, group.providers.length),
        title: names,
        alt: names,
      });

      marker.bindPopup(buildPopupContent(group.providers), { minWidth: 280, maxWidth: 300 });
      layer.addLayer(marker);
    }

    // Only re-frame the map when the set of pin locations actually changes, so an unrelated update
    // (such as a late geocode result for an already-visible location) doesn't undo the user's panning.
    const signature = groups
      .map((group) => group.key)
      .sort()
      .join("|");

    if (groups.length > 0 && signature !== lastFitRef.current) {
      const bounds = L.latLngBounds(groups.map((group) => [group.coordinates.lat, group.coordinates.lng] as [number, number]));
      // The first framing happens as the map opens, so it jumps straight to the pins instead of swooping in from the
      // default view; later changes (search, filters) animate.
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: hasFramedRef.current });
      hasFramedRef.current = true;
    }

    lastFitRef.current = signature;
  }, [groups, mapReady]);

  let message: string | null = null;
  if (groups.length === 0 && pending === 0) {
    message = providers.length === 0 ? "No organizations match your search and filters." : "None of these organizations have a location on file.";
  }

  const notes: string[] = [];
  if (pending > 0) {
    notes.push(`Locating ${pending} organization${pending === 1 ? "" : "s"}…`);
  }
  if (missing > 0 && groups.length > 0) {
    notes.push(`${missing} organization${missing === 1 ? " isn't" : "s aren't"} shown (no location on file).`);
  }

  return (
    // `isolate` keeps Leaflet's internal z-indexes (up to 1000) inside the map, so the filter drop-downs above it always stay on top.
    <div className="relative isolate h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={containerRef} className="h-full w-full" role="region" aria-label="Map of organizations" />

      {message ? (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-6">
          <p className="rounded-lg bg-white/95 px-4 py-2 text-sm text-slate-600 shadow ring-1 ring-slate-200">{message}</p>
        </div>
      ) : null}

      {/* bottom-9 keeps this clear of the OpenStreetMap attribution, which must stay visible. */}
      {notes.length > 0 ? (
        <div aria-live="polite" className="pointer-events-none absolute bottom-9 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-md bg-white/95 px-2.5 py-1.5 text-xs text-slate-600 shadow ring-1 ring-slate-200">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
