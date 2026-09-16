import { NextResponse } from "next/server";

import { getAllProviders, getAllServices } from "@/app/api/airtable";

export const dynamic = "force-dynamic";

/**
 * Public, read-only feed of BIRD's Services + the public-facing details of the
 * Provider offering each one. Built specifically for sharing with trusted
 * external integrations (e.g. ImmigrationGPT) without handing out real
 * Airtable credentials, which would also expose unrelated tables in this base
 * that hold real people's personal data (accounts, contact-form submissions,
 * feedback) — this route only ever touches Services and Providers, and only
 * returns the specific fields below.
 *
 * Requires an API key via the x-api-key header, checked against
 * PUBLIC_SERVICES_API_KEY, so this doesn't sit fully open to arbitrary
 * internet traffic hammering it (and, in turn, this project's Airtable quota).
 */
export async function GET(request: Request) {
  const expectedApiKey = process.env.PUBLIC_SERVICES_API_KEY;

  if (!expectedApiKey) {
    return NextResponse.json({ error: "This API is not currently configured." }, { status: 503 });
  }

  const providedApiKey = request.headers.get("x-api-key");

  if (providedApiKey !== expectedApiKey) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }

  try {
    const [services, providers] = await Promise.all([getAllServices(), getAllProviders()]);
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));

    const payload = services.map((service) => {
      const provider = providerById.get(service.provider_record_ID);

      return {
        id: service.id,
        name: service.name,
        description: service.description || null,
        status: service.status,
        registrationLink: service.link || null,
        serviceTypes: service.service_types ? service.service_types.split(", ") : [],
        provider: provider
          ? {
              name: provider.name,
              email: provider.email || null,
              phone: provider.primary_phone_number || null,
              address: provider.address || null,
              googleMapsLink: provider.google_maps_link || null,
              website: provider.website || null,
              languages: provider.language_support,
            }
          : null,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: payload.length,
      services: payload,
    });
  } catch (error) {
    console.error("Public services API failed:", error);
    return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
  }
}
