import Link from "next/link";
import { Plus } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import { getProviderContext, getServicesForCurrentProvider } from "@/features/services/manage/provider-context";
import { ProviderPicker } from "@/components/services/ProviderPicker";
import { DeleteServiceButton } from "@/components/services/DeleteServiceButton";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-green-100 text-green-800",
  Waitlist: "bg-amber-100 text-amber-800",
  "Contact Provider": "bg-emerald-100 text-emerald-800",
  Full: "bg-rose-100 text-rose-800",
};

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

  const services = await getServicesForCurrentProvider(linkedProvider?.id ?? null);

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
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-slate-900">{service.name}</h2>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_STYLES[service.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {service.status}
                          </span>
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
