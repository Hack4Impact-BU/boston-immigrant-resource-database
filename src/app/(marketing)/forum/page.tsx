import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import RightRail from "@/components/forum/RightRail";
import ForumTabs from "@/components/forum/ForumTabs";
import PostCard from "@/components/forum/PostCard";
import { getForumPosts, type ForumTab } from "@/lib/forum";
import Sidebar from "@/components/marketing/Sidebar";

const VALID_TABS: ForumTab[] = ["recent", "unanswered", "unsolved", "solved"];

async function PostList({ tab }: { tab: ForumTab }) {
  const posts = await getForumPosts(tab);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          No discussions here yet. Be the first to{" "}
          <Link href="/forum/new" className="font-semibold text-[#2F80C2]">
            create a post
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: ForumTab = VALID_TABS.includes(tabParam as ForumTab)
    ? (tabParam as ForumTab)
    : "recent";

  return (
    <div className="flex min-h-screen items-stretch bg-slate-100">
      <Sidebar isOpen={true} activePage="Community Forum" />
      <main className="ml-52 flex min-h-screen flex-1 bg-[#f2f4f7] px-2 py-2 text-slate-800 sm:px-3 sm:py-3">
        <section className="mx-auto flex min-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-1 flex-col rounded-xl bg-white px-4 py-4 shadow-[0_0_0_1px_rgba(229,231,235,0.9)] sm:px-5 sm:py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#2F80C2]">Recent Discussions</h2>
            <Button
              asChild
              className="rounded-md bg-[#2F80C2] px-5 hover:bg-[#256aa3]"
            >
              <Link href="/forum/new">Create a Post</Link>
            </Button>
          </div>

          <div className="flex min-w-0 flex-1 gap-6">
            <div className="min-w-0 flex-1">
              {/* <ForumTabs active={tab} /> */}
              <div className="mt-4">
                <Suspense
                  key={tab}
                  fallback={
                    <div className="py-12 text-center text-sm text-slate-400">
                      Loading discussions…
                    </div>
                  }
                >
                  <PostList tab={tab} />
                </Suspense>
              </div>
            </div>

            <RightRail />
          </div>
        </section>
      </main>
    </div>
  );
}
