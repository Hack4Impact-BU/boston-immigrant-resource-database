import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import Sidebar from "@/components/marketing/Sidebar";
import ServiceTypesTable from "@/components/admin/ServiceTypesTable";
import { getAllServiceTypesForAdmin, getUserRole } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function ServiceTypesPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const userRole = await getUserRole(userId);

  // Admin-only — same gating pattern as the other admin tools.
  if (userRole !== "Admin") {
    notFound();
  }

  const serviceTypes = await getAllServiceTypesForAdmin();

  return (
    <div className="flex h-screen items-stretch overflow-hidden bg-slate-100">
      <Sidebar isOpen={true} activePage="Service Types" />

      <main className="ml-55 flex h-screen flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="flex h-full w-full min-h-0 flex-col">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Service Types</h1>
            <p className="mt-1 text-sm text-slate-600">
              {serviceTypes.length} service type{serviceTypes.length === 1 ? "" : "s"}.
              Changes save automatically when you click away from a field.
            </p>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <ServiceTypesTable serviceTypes={serviceTypes} />
          </div>
        </div>
      </main>
    </div>
  );
}
