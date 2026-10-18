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

        <main className="ml-55 flex-1 px-6 py-8">
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

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          {!linkedProvider ? (
            <ProviderPicker allProviders={allProviders} serviceTypes={serviceTypes} languages={languages} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Services</h1>
                  <p className="mt-1 text-sm text-slate-600">Managing services for {linkedProvider.name}</p>
                </div>

                <Link
                  href="/services/manage/new"
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
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
                  services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
                    >
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">{service.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={statusPillStyle(statusColors[service.status])}
                          >
                            {service.status}
                          </span>
                          <p className="text-xs text-slate-400">{formatRelativeUpdateDate(service.last_modified)}</p>
                        </div>
                        {service.service_types ? (
                          <div className="mt-1 flex flex-wrap gap-1">
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
                          <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-600">
                            {service.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/services/manage/${service.id}/edit`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
