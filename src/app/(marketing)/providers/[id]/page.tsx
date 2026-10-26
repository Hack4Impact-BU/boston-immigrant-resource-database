import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Globe, Mail, MapPin, Pencil, Phone, Plus } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import { DeleteServiceButton } from "@/components/services/DeleteServiceButton";
import { getAllServices, getProviderById } from "@/app/api/airtable";
import { getTableSchema, getUserProviderId, getUserRole } from "@/lib/airtable";
import { getReadableTextColor } from "@/lib/colors";
import { formatRelativeUpdateDate } from "@/lib/dates";
import { buildOpenStreetMapEmbedUrl } from "@/lib/openstreetmap";

export const dynamic = "force-dynamic";

// What Search Services shows for a status that has no color in Airtable.
const STATUS_FALLBACK_COLOR = "#cbd5e1";

// Same look as the Email and Register buttons in Service Details on Search Services.
const SERVICE_ACTION_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-md bg-[#4c8cc9] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3d77b6]";

// A registration link only counts if it is a real web address (http or https). Anything else that ends up in the Link field (no
// "https://", another kind of link, stray text) is ignored instead of becoming a button that goes nowhere.
function getHttpUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === "http:" || protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

type ProviderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
  const { id } = await params;
  const provider = await getProviderById(id);

  if (!provider) {
    notFound();
  }

  const [allServices, ownerUserId, servicesSchema] = await Promise.all([
    getAllServices(),
    auth().then(({ userId }) => userId),
    getTableSchema("Services"),
  ]);
  // The colors Airtable has set for each Status option: the same source the Search Services page reads (through
  // /api/service-status-colors), so a status looks the same in both places. Empty if Airtable can't be reached.
  const statusColors = servicesSchema.find((field) => field.name === "Status")?.optionColors ?? {};
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
  const providerMapEmbedUrl =
    provider.latitude != null && provider.longitude != null
      ? buildOpenStreetMapEmbedUrl(provider.latitude, provider.longitude)
      : null;

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      {/* min-w-0: a flex item can't shrink below its widest content by default, so one long line (a web address, say) made the whole
          page wider than the screen. 16px of padding on a phone, like Search Services, and 24px from sm up. */}
      <main className="ml-55 min-w-0 flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/providers" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              ← All Providers
            </Link>

            {canEditThisProvider ? (
              <Link
                href={`/providers/${provider.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                <Pencil size={16} />
                Edit Profile
              </Link>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {/* A grid, not a row. On a phone the logo is small and sits beside the name, and the contact lines run the full width of the card
                underneath, so a long email or web address has room (and wraps anywhere if it still doesn't fit). From sm up the logo is
                large, at the left across both rows, with the name and the contact lines in the column beside it, as before. */}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_1fr] items-start gap-x-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white sm:row-span-2 sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs */}
                <img
                  src={provider.logo || "/icons/Just_BIRD_logo_blue.png"}
                  alt={provider.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>

              <h1 className="min-w-0 self-center break-words text-xl font-semibold tracking-tight text-slate-900 sm:self-start">{provider.name}</h1>

              <div className="col-span-2 mt-4 space-y-2 sm:col-span-1 sm:col-start-2 sm:mt-3">
                {provider.address ? (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    {provider.google_maps_link ? (
                      <a href={provider.google_maps_link} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere] hover:text-sky-700 hover:underline">
                        {provider.address}
                      </a>
                    ) : (
                      <span className="[overflow-wrap:anywhere]">{provider.address}</span>
                    )}
                  </div>
                ) : null}

                {(provider.primary_phone_number || provider.secondary_phone_number) ? (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="[overflow-wrap:anywhere]">
                      {[provider.primary_phone_number, provider.secondary_phone_number].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ) : null}

                {provider.email ? (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <a href={`mailto:${provider.email}`} className="[overflow-wrap:anywhere] hover:text-sky-700 hover:underline">
                      {provider.email}
                    </a>
                  </div>
                ) : null}

                {provider.website ? (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Globe size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere] hover:text-sky-700 hover:underline">
                      {provider.website}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            {provider.language_support.length > 0 ? (
              <p className="mt-5 break-words text-xs text-slate-500">{provider.language_support.join(" · ")}</p>
            ) : null}

            {provider.service_types ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.service_types.split(", ").map((serviceType) => (
                  <span
                    key={serviceType}
                    className="max-w-full rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 [overflow-wrap:anywhere]"
                  >
                    {serviceType}
                  </span>
                ))}
              </div>
            ) : null}

            {provider.description ? (
              <p className="mt-5 whitespace-pre-line break-words border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{provider.description}</p>
            ) : null}
          </div>

          {providerMapEmbedUrl ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Location</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <iframe
                  src={providerMapEmbedUrl}
                  title={`Map showing the location of ${provider.name}`}
                  className="h-72 w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
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
                {provider.address ? (
                  <a
                    href={
                      provider.google_maps_link ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.address)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-700 underline decoration-slate-300 hover:text-sky-700 hover:decoration-sky-700"
                  >
                    {provider.address}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Services ({providerServices.length})
            </h2>
            {canEditThisProvider ? (
              <Link
                href={`/services/manage/new?providerId=${provider.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                <Plus size={16} />
                Add Service
              </Link>
            ) : null}
          </div>

          <div className="mt-3 space-y-3">
            {providerServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No services listed for this provider yet.
              </div>
            ) : (
              providerServices.map((service) => {
                // The provider's own email, which is what Email does in Service Details; falls back to the one stored on the service.
                const contactEmail = provider.email || service.provider_email;
                const registerUrl = getHttpUrl(service.link);
                const hasActions = Boolean(contactEmail || registerUrl || canEditThisProvider);
                const statusColor = statusColors[service.status] || STATUS_FALLBACK_COLOR;

                // Text sizes follow the cards on the Providers page: 16px name, 14px description (on a 22px line), 13px for the status, the
                // updated date and the buttons, and 12px for the type tags. They were 14, 12, 12 and 10.4px, which is small for the older
                // readers this site is for, and the date was in slate-400, which falls short of the 4.5:1 contrast WCAG asks for (about
                // 2.6:1; slate-500 is 4.8:1). The description runs the whole width of its column, right up to the buttons (with a 24px
                // gap from sm up), so there is no blank space beside it. The price is that a card with only an Email button has a wider text
                // column, and longer lines, than one with Email and Register.
                //
                // A card with buttons is a two-column grid. Row 1 is the service's name, with its status and updated date on the line
                // below, and the buttons at the top right on every screen size. Row 2 is the types and description: on a phone it runs
                // the full width of the card, and from sm up it stays in the left column, because the buttons then span both rows.
                // (Row 2 is 1fr so that extra height from tall buttons, such as Edit and Delete under Email and Register, lands there
                // and never opens a gap under the name.) Without buttons the card is just these blocks stacked, as it always was.
                // On a phone the buttons column is display: contents, so Email and Register stay at the top right of row 1 and the
                // Edit/Delete row becomes a footer of its own in row 3, right-aligned under the description. From sm up the column is
                // a real one, as tall as the card, and the Edit/Delete row is pushed to the bottom of it (mt-auto), so it ends at the
                // bottom right of the card, as far from Email and Register as the card allows. A card with no spare room keeps them
                // just below, and with no Email or Register they are the whole column, so they sit at the bottom right too.
                return (
                  <div
                    key={service.id}
                    className={`rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm ${
                      hasActions ? "grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr] gap-x-3 sm:gap-x-6" : ""
                    }`}
                  >
                    <div className="col-start-1 row-start-1 min-w-0">
                      <h3 className="break-words text-base font-semibold text-slate-900">{service.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                          style={{ backgroundColor: statusColor, color: getReadableTextColor(statusColor) }}
                        >
                          {service.status}
                        </span>
                        <p className="text-[13px] text-slate-500">{formatRelativeUpdateDate(service.last_modified)}</p>
                      </div>
                    </div>

                    {service.service_types || service.description ? (
                      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1">
                        {service.service_types ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {service.service_types.split(", ").map((serviceType) => (
                              <span
                                key={serviceType}
                                className="max-w-full rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 [overflow-wrap:anywhere]"
                              >
                                {serviceType}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {service.description ? (
                          <p className="mt-2 whitespace-pre-line break-words text-sm leading-[22px] text-slate-600">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {hasActions ? (
                      <div className="max-sm:contents sm:col-start-2 sm:row-start-1 sm:row-span-2 sm:flex sm:shrink-0 sm:flex-col sm:items-end sm:gap-2 sm:self-stretch">
                        {contactEmail || registerUrl ? (
                          <div className="flex justify-end gap-2 max-sm:col-start-2 max-sm:row-start-1 max-sm:self-start">
                            {contactEmail ? (
                              <a
                                href={`mailto:${contactEmail}`}
                                aria-label={`Email about ${service.name}`}
                                className={SERVICE_ACTION_BUTTON_CLASS}
                              >
                                Email
                              </a>
                            ) : null}
                            {registerUrl ? (
                              <a
                                href={registerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Register for ${service.name}`}
                                className={SERVICE_ACTION_BUTTON_CLASS}
                              >
                                Register
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                        {canEditThisProvider ? (
                          <div className="flex items-center gap-2 max-sm:col-span-full max-sm:row-start-3 max-sm:mt-3 max-sm:justify-self-end sm:mt-auto">
                            <Link
                              href={`/services/manage/${service.id}/edit`}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </Link>
                            <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
