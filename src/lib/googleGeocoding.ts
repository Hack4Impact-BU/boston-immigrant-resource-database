import "server-only";

export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Geocodes a street address using Google's Geocoding API. This must run
 * server-side only — the API key is never exposed to the browser, unlike a
 * NEXT_PUBLIC_ variable would be. Google's Geocoding API handles messy
 * real-world addresses (suite numbers, floor numbers, etc.) far more
 * reliably than Nominatim, and its rate limits are dramatically more
 * generous, so callers don't need the artificial throttling Nominatim required.
 */
export async function geocodeAddressWithGoogle(address: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || !address.trim()) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address.trim()
    )}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Geocoding request failed for "${address}": HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      status: string;
      error_message?: string;
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };

    if (data.status !== "OK" || !data.results[0]) {
      // Google's status codes are specific and worth seeing directly rather
      // than just returning null: ZERO_RESULTS (address genuinely can't be
      // matched), INVALID_REQUEST (malformed query), OVER_QUERY_LIMIT,
      // REQUEST_DENIED (bad/restricted API key), etc.
      console.error(
        `Geocoding returned non-OK status for "${address}": ${data.status}${
          data.error_message ? ` — ${data.error_message}` : ""
        }`
      );
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;

    return { lat, lng };
  } catch (error) {
    console.error(`Geocoding threw for "${address}":`, error);
    return null;
  }
}
