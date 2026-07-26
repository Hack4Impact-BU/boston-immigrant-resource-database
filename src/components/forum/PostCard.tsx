import Link from "next/link";
import { CalendarDays, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { formatDate, type ForumPostListItem } from "@/lib/forum";

export default function PostCard({ post }: { post: ForumPostListItem }) {
  return (
    <Link
      href={`/forum/${post.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex gap-4">
        {/* <span className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-slate-100" /> */}

        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {post.authorName || "Anonymous"}
            </span>{" "}
          </p>

          <h3 className="mt-1 text-base font-bold text-slate-800">
            {post.title}
          </h3>

          {post.body ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
              {post.body}
            </p>
          ) : null}

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 text-[#2F80C2]" />
            {formatDate(post.createdAt)}
          </div>
        </div>

        <div className="flex shrink-0 items-end gap-3 self-end text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5 text-[#2F80C2]" />
            {post.upvotes ?? 0}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-1">
            <ThumbsDown className="h-3.5 w-3.5 text-[#2F80C2]" />
            {post.downvotes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-[#2F80C2]" />
            {post.commentCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
