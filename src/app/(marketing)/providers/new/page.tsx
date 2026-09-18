import Link from "next/link";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import { NewProviderPageContent } from "@/components/services/NewProviderPageContent";
import { getProviderContext } from "@/features/services/manage/provider-context";

export const dynamic = "force-dynamic";

export default async function NewProviderPage() {
  const { userRole, serviceTypes, languages } = await getProviderContext();

  // Admin-only: this creates a standalone, unlinked Provider record, which
  // only makes sense as an Admin action (see createProviderAsAdmin).
  if (userRole !== "Admin") {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-xl">
          <Link href="/providers" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← Back to Providers
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Add a Provider</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              This adds the Provider to the directory without linking it to any account — new users can link
              themselves to it later once they register.
            </p>

            <div className="mt-5">
              <NewProviderPageContent serviceTypes={serviceTypes} languages={languages} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
