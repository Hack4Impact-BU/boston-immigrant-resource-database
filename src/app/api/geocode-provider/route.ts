import { NextResponse } from "next/server";

import { getProviderById, updateProviderCoordinates } from "@/app/api/airtable";
import { geocodeAddressWithGoogle } from "@/lib/googleGeocoding";

export async function POST(request: Request) {
  try {
    const { providerId } = (await request.json()) as { providerId?: string };

    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }

    const provider = await getProviderById(providerId);

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Defensive check: if this provider already has stored coordinates (e.g. a
    // second request came in before the first one's write-back landed), just
    // return them rather than re-geocoding unnecessarily.
    if (provider.latitude !== null && provider.longitude !== null) {
      return NextResponse.json({ lat: provider.latitude, lng: provider.longitude });
    }

    if (!provider.address) {
      return NextResponse.json({ lat: null, lng: null });
    }

    const coordinates = await geocodeAddressWithGoogle(provider.address);

    if (!coordinates) {
      return NextResponse.json({ lat: null, lng: null });
    }

    // Write back so this provider is resolved permanently — the map will
    // never need to geocode it again after this one time.
    await updateProviderCoordinates(providerId, coordinates.lat, coordinates.lng);

    return NextResponse.json({ lat: coordinates.lat, lng: coordinates.lng });
  } catch (error) {
    console.error("Geocode-provider route failed:", error);
    return NextResponse.json({ error: "Failed to geocode provider" }, { status: 500 });
  }
}
