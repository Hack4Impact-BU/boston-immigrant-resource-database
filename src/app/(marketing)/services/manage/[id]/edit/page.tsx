import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getProviderContext } from "@/features/services/manage/provider-context";
import { getServiceById } from "@/app/api/airtable";
import { updateServiceAction } from "@/features/services/manage/save-service";

type EditServicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const { linkedProvider, serviceTypes } = await getProviderContext();

  if (!linkedProvider) {
    redirect("/services/manage");
  }

  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const belongsToCurrentProvider =
    service.provider === linkedProvider.id || service.provider_record_ID === linkedProvider.id;

  if (!belongsToCurrentProvider) {
    notFound();
  }

  async function handleUpdate(input: Parameters<typeof updateServiceAction>[1]) {
    "use server";
    await updateServiceAction(id, input);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Manage Services" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-lg">
          <Link href="/services/manage" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← Back to my services
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Edit Service</h1>
            <p className="mt-1.5 text-sm text-slate-600">For {linkedProvider.name}</p>

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
