import { auth } from "@clerk/nextjs/server";

import Sidebar from "@/components/marketing/Sidebar";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { getUserProfileForFeedback } from "@/lib/airtable";

export default async function FeedbackPage() {
  const { userId } = await auth();
  const profile = userId ? await getUserProfileForFeedback(userId) : null;

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Support / Feedback" />

      <main className="ml-55 flex-1 px-6 py-8">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Support / Feedback</h1>
          <p className="mt-1 text-sm text-slate-600">
            Request help, report a bug, suggest a feature, or let us know what&apos;s on your mind.
          </p>

          <div className="mt-6">
            <FeedbackForm defaultEmail={profile?.email ?? ""} />
          </div>
        </div>
      </main>
    </div>
  );
}
