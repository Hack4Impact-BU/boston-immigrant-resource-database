import Link from "next/link";
import { redirect } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getProviderContext } from "@/features/services/manage/provider-context";
import { getProviderById } from "@/app/api/airtable";
import { createServiceAction } from "@/features/services/manage/save-service";

type NewServicePageProps = {
  searchParams: Promise<{ providerId?: string }>;
};

export default async function NewServicePage({ searchParams }: NewServicePageProps) {
  const { providerId: requestedProviderId } = await searchParams;
  const { userRole, linkedProvider, serviceTypes } = await getProviderContext();

  const isAdmin = userRole === "Admin";

  // An Admin arriving from an arbitrary Provider's own page passes providerId
  // explicitly; everyone else always creates for their own linked Provider,
  // regardless of what's in the URL — the Server Action re-verifies this
  // independently either way, so this is about the right UI, not the only guard.
  const targetProvider =
    isAdmin && requestedProviderId ? await getProviderById(requestedProviderId) : linkedProvider;

  if (!targetProvider) {
    redirect("/services/manage");
  }

  const providerId = targetProvider.id;
  const isForSomeoneElse = isAdmin && requestedProviderId != null;
  const backHref = isForSomeoneElse ? `/providers/${providerId}` : "/services/manage";
  const backLabel = isForSomeoneElse ? `Back to ${targetProvider.name}` : "Back to my services";

  async function handleCreate(input: Parameters<typeof createServiceAction>[1]) {
    "use server";
    await createServiceAction(providerId, input);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage={isForSomeoneElse ? "Providers" : "Manage My Services"} />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-lg">
          <Link href={backHref} className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← {backLabel}
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Add a Service</h1>
            <p className="mt-1.5 text-sm text-slate-600">For {targetProvider.name}</p>

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
