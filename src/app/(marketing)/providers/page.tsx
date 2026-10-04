import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import ProvidersGrid from "@/components/marketing/providers/ProvidersGrid";
import { getAllProviders } from "@/app/api/airtable";
import { getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const { userId } = await auth();
  const [providers, userRole] = await Promise.all([getAllProviders(), userId ? getUserRole(userId) : null]);
  const sortedProviders = [...providers].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="hidden text-2xl font-semibold tracking-tight text-slate-900 md:block">Providers</h1>
            {userRole === "Admin" ? (
              <Link
                href="/providers/new"
                className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                <Plus size={16} />
                Add Provider
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            <ProvidersGrid providers={sortedProviders} />
          </div>
        </div>
      </main>
    </div>
  );
}
