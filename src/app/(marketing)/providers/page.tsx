import Link from "next/link";

import Sidebar from "@/components/marketing/Sidebar";
import { getAllProviders } from "@/app/api/airtable";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providers = await getAllProviders();
  const sortedProviders = [...providers].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Providers" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Providers</h1>
          <p className="mt-1 text-sm text-slate-600">
            {sortedProviders.length} organization{sortedProviders.length === 1 ? "" : "s"} in the BIRD directory
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs, not a fixed set next/image can optimize */}
                    <img
                      src={provider.logo || "/icons/Just_BIRD_logo_blue.png"}
                      alt={provider.name}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-900">{provider.name}</h2>
                    <p className="truncate text-xs text-slate-500">
                      {provider.address || "Location not listed"}
                    </p>
                  </div>
                </div>

                {provider.description ? (
                  <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">{provider.description}</p>
                ) : null}

                {provider.language_support.length > 0 ? (
                  <p className="mt-3 truncate text-xs text-slate-400">
                    {provider.language_support.slice(0, 3).join(" · ")}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
