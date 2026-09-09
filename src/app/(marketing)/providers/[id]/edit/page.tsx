import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import Sidebar from "@/components/marketing/Sidebar";
import { ProviderEditForm } from "@/components/services/ProviderEditForm";
import { getAllLanguages, getAllServiceTypes, getProviderById } from "@/app/api/airtable";
import { getUserProviderId } from "@/lib/airtable";
import { updateProviderAction } from "@/features/services/manage/save-provider";

type EditProviderPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const linkedProviderId = await getUserProviderId(userId);

  // Ownership check at the page level, for a clean 404 instead of a flash of a form
  // the visitor can't actually save. The Server Action re-checks this independently
  // and is the real enforcement boundary, since it's reachable directly via POST.
  if (!linkedProviderId || linkedProviderId !== id) {
    notFound();
  }

  const [provider, serviceTypes, languages] = await Promise.all([
    getProviderById(id),
    getAllServiceTypes(),
    getAllLanguages(),
  ]);

  if (!provider) {
    notFound();
  }

  async function handleUpdate(input: Parameters<typeof updateProviderAction>[1]) {
    "use server";
    await updateProviderAction(id, input);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <Link href={`/providers/${id}`} className="text-xs font-medium text-slate-500 hover:text-slate-700">
            ← Back to Provider profile
          </Link>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Edit Provider Profile</h1>

            <div className="mt-5">
              <ProviderEditForm
                provider={provider}
                serviceTypes={serviceTypes}
                languages={languages}
                onSubmit={handleUpdate}
                cancelHref={`/providers/${id}`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
