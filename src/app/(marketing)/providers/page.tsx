import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

import Sidebar from "@/components/marketing/Sidebar";
import ProvidersGrid from "@/components/marketing/providers/ProvidersGrid";
import { getAllProviders } from "@/app/api/airtable";
import { getUserRole } from "@/lib/airtable";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const { userId } = await auth();
  const [providers, userRole] = await Promise.all([getAllProviders(), userId ? getUserRole(userId) : null]);
  const sortedProviders = [...providers].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="flex h-dvh items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      {/* Phones (below sm) get a 16px margin on every side. The gap under the fixed header is the shared 4.5rem offset, which is 16px
          below the 3.5rem header, so it needs no override there. From sm up the layout is as it was. */}
      <main className="ml-55 flex-1 px-4 pb-4 sm:px-6 sm:py-8 sm:[--mobile-header-offset:4rem]">
        {/* The page is exactly one screen tall (h-dvh above, h-full here, whatever the margins are), so it never scrolls itself: the
            search, filters and view switch stay put and only the results scroll, inside ProvidersGrid. */}
        <div className="mx-auto flex h-full max-w-5xl flex-col">
          <div className="flex shrink-0 items-center justify-between">
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

          {/* Below md the title is hidden, so for anyone but an admin (who still sees the Add Provider button) the row above is empty
              and gets no space under it. */}
          <div className={cn("flex min-h-0 flex-1 flex-col md:mt-4", userRole === "Admin" ? "mt-2" : "mt-0")}>
            <ProvidersGrid providers={sortedProviders} />
          </div>
        </div>
      </main>
    </div>
  );
}
