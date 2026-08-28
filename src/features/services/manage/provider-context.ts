import "server-only";

import { auth } from "@clerk/nextjs/server";

import { getAllProviders, getAllServiceTypes, getAllServices, type Provider, type Service, type ServiceType } from "@/app/api/airtable";
import { getUserProviderId } from "@/lib/airtable";

export type ProviderContext = {
  clerkUserId: string;
  linkedProvider: Provider | null;
  allProviders: Provider[];
  serviceTypes: ServiceType[];
};

/**
 * Loads the current signed-in user's provider-management context. Throws if there's
 * no signed-in user — every caller of this is a page that already sits behind the
 * approved-user redirect in proxy.ts, so reaching this function without a session
 * would indicate something is wrong rather than a normal state to render around.
 */
export async function getProviderContext(): Promise<ProviderContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to manage services.");
  }

  const [linkedProviderId, allProviders, serviceTypes] = await Promise.all([
    getUserProviderId(userId),
    getAllProviders(),
    getAllServiceTypes(),
  ]);

  const linkedProvider = linkedProviderId
    ? allProviders.find((provider) => provider.id === linkedProviderId) ?? null
    : null;

  return {
    clerkUserId: userId,
    linkedProvider,
    allProviders,
    serviceTypes,
  };
}

/**
 * Services belonging to the current user's linked provider. Returns an empty array
 * (rather than throwing) if no provider is linked yet, since "no services yet" is a
 * normal, renderable state for the management page.
 */
export async function getServicesForCurrentProvider(providerId: string | null): Promise<Service[]> {
  if (!providerId) {
    return [];
  }

  const allServices = await getAllServices();

  return allServices.filter((service) => service.provider === providerId || service.provider_record_ID === providerId);
}
