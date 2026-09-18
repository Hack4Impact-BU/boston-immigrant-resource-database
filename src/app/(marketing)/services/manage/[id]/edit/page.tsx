import Link from "next/link";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getProviderContext } from "@/features/services/manage/provider-context";
import { getProviderById, getServiceById } from "@/app/api/airtable";
import { updateServiceAction } from "@/features/services/manage/save-service";

type EditServicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const { userRole, linkedProvider, serviceTypes } = await getProviderContext();

  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const isAdmin = userRole === "Admin";
  const belongsToCurrentProvider =
    linkedProvider != null &&
    (service.provider === linkedProvider.id || service.provider_record_ID === linkedProvider.id);

  // Admins can edit any Provider's service, matching updateServiceAction's own
  // bypass — everyone else must own the Provider this service belongs to.
  if (!isAdmin && !belongsToCurrentProvider) {
    notFound();
  }

  // The service's own Provider isn't necessarily the current user's
  // linkedProvider — an Admin editing someone else's service has no link to
  // it at all (or a different one entirely), so look it up directly rather
  // than assuming.
  const serviceProvider = belongsToCurrentProvider ? linkedProvider : await getProviderById(service.provider_record_ID);
  const backHref = isAdmin ? `/providers/${service.provider_record_ID}` : "/services/manage";
  const backLabel = isAdmin ? `Back to ${serviceProvider?.name ?? "provider"}` : "Back to my services";

  async function handleUpdate(input: Parameters<typeof updateServiceAction>[1]) {
    "use server";
    await updateServiceAction(id, input);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage={isAdmin ? "Providers" : "Manage My Services"} />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-lg">
          <Link href={backHref} className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← {backLabel}
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Edit Service</h1>
            <p className="mt-1.5 text-sm text-slate-600">For {serviceProvider?.name ?? "this provider"}</p>

            <div className="mt-5">
              <ServiceForm
                serviceTypes={serviceTypes}
                submitLabel="Save Changes"
                initialValues={{
                  name: service.name,
                  description: service.description ?? "",
                  status: service.status,
                  link: service.link ?? "",
                  serviceTypeIds: service.service_type_ids,
                }}
                onSubmit={handleUpdate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
