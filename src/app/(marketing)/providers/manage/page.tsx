import { redirect } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { getProviderContext } from "@/features/services/manage/provider-context";
import { ProviderPicker } from "@/components/services/ProviderPicker";

export default async function ManageMyProviderPage() {
  const { userRole, linkedProvider, allProviders, serviceTypes, languages } = await getProviderContext();

  if (userRole !== "Provider" && userRole !== "Admin") {
    return (
      <div className="flex min-h-screen items-stretch bg-slate-100">
        <Sidebar isOpen={true} activePage="Manage My Provider" />

        <main className="ml-55 flex-1 px-6 py-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Not available for Viewer accounts</h1>
            <p className="mt-2 text-sm text-slate-600">
              Viewer accounts are for organizations searching for Services, not offering them, so there&apos;s no
              Provider profile to manage here.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // This route is just a shortcut — once linked, there's nothing of its own
  // to show that the Provider's own details page doesn't already have.
  if (linkedProvider) {
    redirect(`/providers/${linkedProvider.id}`);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Manage My Provider" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <ProviderPicker allProviders={allProviders} serviceTypes={serviceTypes} languages={languages} />
        </div>
      </main>
    </div>
  );
}
