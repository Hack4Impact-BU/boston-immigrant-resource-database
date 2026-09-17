import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import { getAllServices, getProviderById } from "@/app/api/airtable";
import { getUserProviderId, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-green-100 text-green-800",
  Waitlist: "bg-amber-100 text-amber-800",
  "Contact Provider": "bg-emerald-100 text-emerald-800",
  Full: "bg-rose-100 text-rose-800",
};

type ProviderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
  const { id } = await params;
  const provider = await getProviderById(id);

  if (!provider) {
    notFound();
  }

  const [allServices, ownerUserId] = await Promise.all([
    getAllServices(),
    auth().then(({ userId }) => userId),
  ]);
  const providerServices = allServices.filter(
    (service) => service.provider === provider.id || service.provider_record_ID === provider.id
  );
  const [linkedProviderId, viewerRole] = ownerUserId
    ? await Promise.all([getUserProviderId(ownerUserId), getUserRole(ownerUserId)])
    : [null, null];
  // Admins can edit any Provider's profile ("as if a Provider for all
  // organizations"), not just their own linked one — but only when their
  // role actually permits writing at all. Being linked to this Provider
  // isn't enough on its own: a Viewer who still has an old provider link
  // sitting on their account (role and link are separate fields — changing
  // one doesn't clear the other) must not see this button either.
  const canWrite = viewerRole === "Provider" || viewerRole === "Admin";
  const canEditThisProvider = canWrite && (linkedProviderId === provider.id || viewerRole === "Admin");

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <Link href="/providers" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              ← All Providers
            </Link>

            {canEditThisProvider ? (
              <Link
                href={`/providers/${provider.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={13} />
                Edit Profile
              </Link>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs */}
                <img
                  src={provider.logo || "/icons/Just_BIRD_logo_blue.png"}
                  alt={provider.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">{provider.name}</h1>

                <div className="mt-3 space-y-2">
                  {provider.address ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-600">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      {provider.google_maps_link ? (
                        <a href={provider.google_maps_link} target="_blank" rel="noopener noreferrer" className="hover:text-sky-700 hover:underline">
                          {provider.address}
                        </a>
                      ) : (
                        <span>{provider.address}</span>
                      )}
                    </div>
                  ) : null}

                  {(provider.primary_phone_number || provider.secondary_phone_number) ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>
                        {[provider.primary_phone_number, provider.secondary_phone_number].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  ) : null}

                  {provider.email ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <a href={`mailto:${provider.email}`} className="hover:text-sky-700 hover:underline">
                        {provider.email}
                      </a>
                    </div>
                  ) : null}

                  {provider.website ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Globe size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-sky-700 hover:underline">
                        {provider.website}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {provider.language_support.length > 0 ? (
              <p className="mt-5 text-xs text-slate-500">{provider.language_support.join(" · ")}</p>
            ) : null}

            {provider.service_types ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.service_types.split(", ").map((serviceType) => (
                  <span
                    key={serviceType}
                    className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                  >
                    {serviceType}
                  </span>
                ))}
              </div>
            ) : null}

            {provider.description ? (
              <p className="mt-5 whitespace-pre-line border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{provider.description}</p>
            ) : null}
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight text-slate-900">
            Services ({providerServices.length})
          </h2>

          <div className="mt-3 space-y-3">
            {providerServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No services listed for this provider yet.
              </div>
            ) : (
              providerServices.map((service) => (
                <div key={service.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{service.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[service.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                  {service.service_types ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {service.service_types.split(", ").map((serviceType) => (
                        <span
                          key={serviceType}
                          className="rounded-full bg-sky-50 px-2 py-0.5 text-[0.65rem] font-medium text-sky-700"
                        >
                          {serviceType}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {service.description ? (
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-600">{service.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
