import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import { getAllServices, getProviderById } from "@/app/api/airtable";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-green-100 text-green-800",
  Waitlist: "bg-amber-100 text-amber-800",
  "Contact Provider": "bg-emerald-100 text-emerald-800",
  Closed: "bg-rose-100 text-rose-800",
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

  const allServices = await getAllServices();
  const providerServices = allServices.filter(
    (service) => service.provider === provider.id || service.provider_record_ID === provider.id
  );

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/providers" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← All providers
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs */}
                <img
                  src={provider.logo || "/icons/Just_BIRD_logo_blue.png"}
                  alt={provider.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>

              <div className="min-w-0 pt-1">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">{provider.name}</h1>
                {provider.language_support.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">{provider.language_support.join(" · ")}</p>
                ) : null}
              </div>
            </div>

            {provider.description ? (
              <p className="mt-5 text-sm leading-6 text-slate-700">{provider.description}</p>
            ) : null}

            {provider.service_types ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
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

            <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
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
                  {service.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-600">{service.description}</p>
                  ) : null}
                  {service.service_types ? (
                    <p className="mt-1.5 text-xs text-slate-400">{service.service_types}</p>
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
