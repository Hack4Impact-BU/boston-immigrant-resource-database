import Link from "next/link";
import { redirect } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getProviderContext } from "@/features/services/manage/provider-context";
import { createServiceAction } from "@/features/services/manage/save-service";

export default async function NewServicePage() {
  const { linkedProvider, serviceTypes } = await getProviderContext();

  if (!linkedProvider) {
    redirect("/services/manage");
  }

  async function handleCreate(input: Parameters<typeof createServiceAction>[0]) {
    "use server";
    await createServiceAction(input);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Manage My Services" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-lg">
          <Link href="/services/manage" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← Back to my services
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Add a Service</h1>
            <p className="mt-1.5 text-sm text-slate-600">For {linkedProvider.name}</p>

            <div className="mt-5">
              <ServiceForm
                serviceTypes={serviceTypes}
                submitLabel="Add Service"
                onSubmit={handleCreate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
