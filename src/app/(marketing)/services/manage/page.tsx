import Link from "next/link";
import { Plus } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import { getProviderContext, getServicesForCurrentProvider } from "@/features/services/manage/provider-context";
import { ProviderPicker } from "@/components/services/ProviderPicker";
import { DeleteServiceButton } from "@/components/services/DeleteServiceButton";
import { getTableSchema } from "@/lib/airtable";
import { getReadableTextColor } from "@/lib/colors";
import { formatRelativeUpdateDate } from "@/lib/dates";

// What Search Services shows for a status that has no color in Airtable.
const STATUS_FALLBACK_COLOR = "#cbd5e1";

// A status pill's colors: the one Airtable has set for that Status option (or the fallback) and text that is readable on it.
function statusPillStyle(color: string | undefined) {
  const backgroundColor = color || STATUS_FALLBACK_COLOR;
  return { backgroundColor, color: getReadableTextColor(backgroundColor) };
}

export default async function ManageServicesPage() {
  const { userRole, linkedProvider, allProviders, serviceTypes, languages } = await getProviderContext();

  if (userRole !== "Provider") {
    return (
      <div className="flex min-h-screen items-stretch bg-slate-100">
        <Sidebar isOpen={true} activePage="Manage My Services" />

        <main className="ml-55 min-w-0 flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Not available for your account</h1>
            <p className="mt-2 text-sm text-slate-600">
              {userRole === "Admin"
                ? "Admins manage a Provider's Services directly from that Provider's own profile page, not from here."
                : "Viewer accounts are for organizations searching for Services, not offering them, so there's nothing to manage here."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const [services, servicesSchema] = await Promise.all([
    getServicesForCurrentProvider(linkedProvider?.id ?? null),
    getTableSchema("Services"),
  ]);
  // The colors Airtable has set for each Status option: the same source the Search Services and Provider Details pages use, so a
  // status looks the same everywhere. Empty if Airtable can't be reached.
  const statusColors = servicesSchema.find((field) => field.name === "Status")?.optionColors ?? {};

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Manage My Services" />

      <main className="ml-55 min-w-0 flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {!linkedProvider ? (
            <ProviderPicker allProviders={allProviders} serviceTypes={serviceTypes} languages={languages} />
          ) : (
            <>
              {/* min-w-0 on the page, and the name here allowed to wrap: a flex item can't shrink below its widest content by default, so
                  one long line made the whole page wider than the screen, with Add Service off the edge of it. */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Services</h1>
                  <p className="mt-1 break-words text-sm text-slate-600">Managing services for {linkedProvider.name}</p>
                </div>

                <Link
                  href="/services/manage/new"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
                >
                  <Plus size={16} />
                  Add Service
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                    You haven&apos;t added any services yet.
                  </div>
                ) : (
                  services.map((service) => {
                    const hasTypes = Boolean(service.service_types);
                    const hasDescription = Boolean(service.description);
                    const editDeleteButtons = (
                      <div className="flex shrink-0 items-center gap-2 max-sm:self-end">
                        <Link
                          href={`/services/manage/${service.id}/edit`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                      </div>
                    );

                    // The same card as the Service cards on the Provider Details page (there is no Email or Register here, since these
                    // are the provider's own services). Text sizes: 16px name, 14px description (on a 22px line), 13px for the status, the
                    // updated date and the buttons, and 12px for the type tags. They were 14, 12, 12 and 10.4px, which is small for the
                    // older readers this site is for, and the date was in slate-400, which falls short of the 4.5:1 contrast WCAG asks for
                    // (about 2.6:1; slate-500 is 4.8:1). The name wraps, instead of being cut off with an ellipsis, so it can be read in
                    // full (and a long one can no longer widen the page).
                    //
                    // The card is rows, so that each row can use its own width. Row 1 is the service's name, with its status and updated
                    // date on the line below. Row 2 is the types. Row 3 is the description, with Edit and Delete at its bottom right: the
                    // description runs right up to them (24px away from sm up). A service with no description has Edit and Delete on the
                    // row of types instead, and with neither they get a row of their own. On a phone the rows simply stack, and Edit and
                    // Delete are a footer, right-aligned under the description.
                    return (
                      <div key={service.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                        <div className="min-w-0">
                          <h2 className="break-words text-base font-semibold text-slate-900">{service.name}</h2>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                              className="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                              style={statusPillStyle(statusColors[service.status])}
                            >
                              {service.status}
                            </span>
                            <p className="text-[13px] text-slate-500">{formatRelativeUpdateDate(service.last_modified)}</p>
                          </div>
                        </div>

                        {hasTypes ? (
                          <div className="mt-2 flex items-end gap-x-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-y-3 sm:gap-x-6">
                            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                              {service.service_types.split(", ").map((serviceType) => (
                                <span
                                  key={serviceType}
                                  className="max-w-full rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 [overflow-wrap:anywhere]"
                                >
                                  {serviceType}
                                </span>
                              ))}
                            </div>
                            {!hasDescription ? editDeleteButtons : null}
                          </div>
                        ) : null}

                        {hasDescription ? (
                          <div className="mt-2 flex items-end gap-x-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-y-3 sm:gap-x-6">
                            <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm leading-[22px] text-slate-600">
                              {service.description}
                            </p>
                            {editDeleteButtons}
                          </div>
                        ) : null}

                        {!hasTypes && !hasDescription ? <div className="mt-3 flex justify-end">{editDeleteButtons}</div> : null}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
