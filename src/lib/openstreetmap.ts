/**
 * Builds a URL for OpenStreetMap's free, no-API-key iframe embed
 * (openstreetmap.org/export/embed.html), centered on a single point with a
 * marker. The embed only accepts a bounding box, not a zoom level, so delta
 * controls how zoomed-in the view appears — ~0.006 degrees is roughly a
 * close, walkable neighborhood view, which is the default used throughout
 * this app for a single-location preview.
 */
export function buildOpenStreetMapEmbedUrl(lat: number, lng: number, delta: number = 0.006): string {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
