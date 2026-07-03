import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Search,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import RightRail from "@/components/forum/RightRail";
import VoteButtons from "@/components/forum/VoteButtons";
import CommentForm from "@/components/forum/CommentForm";
import { voteComment } from "@/app/(marketing)/forum/actions";
import { getForumPost, formatRelativeTime, formatDate } from "@/lib/forum";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getForumPost(slug);

  if (!post) notFound();

  return (
    <div className="mx-auto mt-8 flex w-full gap-6 px-4">
      <div className="min-w-0 flex-1">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link
                href="/forum"
                aria-label="Back to forum"
                className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-slate-100" />
              <div className="leading-tight">
                <p className="text-sm">
                  <span className="font-semibold text-slate-700">
                    {post.category || "Community"}
                  </span>{" "}
                  <span className="text-slate-400">
                    · {formatRelativeTime(post.createdAt)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {post.authorName || "Anonymous"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-4 w-4 text-[#2F80C2]" />
              {formatDate(post.createdAt)}
            </div>
          </div>

          {/* Body */}
          <h1 className="mt-4 text-lg font-bold text-slate-800">
            {post.title}
          </h1>
          {post.body ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {post.body.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ) : null}

          {post.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              className="mt-4 max-h-96 w-full rounded-lg border border-slate-200 object-cover"
            />
          ) : null}

          {post.linkUrl ? (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block break-all text-sm text-[#2F80C2] hover:underline"
            >
              {post.linkUrl}
            </a>
          ) : null}

          {post.poll?.options?.length ? (
            <PollBlock poll={post.poll} />
          ) : null}

          {/* Reactions */}
          <div className="mt-4">
            <VoteButtons
              postId={post._id}
              slug={post.slug}
              upvotes={post.upvotes ?? 0}
              downvotes={post.downvotes ?? 0}
              commentCount={post.commentCount}
            />
          </div>

          {/* Sort + search comments */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs text-slate-500">Sort by:</span>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-slate-700"
            >
              Best <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
              <Search className="h-3.5 w-3.5" />
              Search Comments
            </div>
          </div>

          {/* Comments */}
          <div className="mt-4 flex flex-col gap-3">
            {post.comments.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No comments yet. Start the conversation below.
              </p>
            ) : (
              post.comments.map((comment) => (
                <div
                  key={comment._id}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 shrink-0 rounded-full border border-slate-200 bg-slate-100" />
                    <p className="text-xs">
                      <span className="font-semibold text-slate-700">
                        {comment.authorName || "Anonymous"}
                      </span>{" "}
                      <span className="text-slate-400">
                        {comment.authorHandle}
                      </span>{" "}
                      <span className="text-slate-400">
                        · {formatRelativeTime(comment.createdAt)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 pl-9 text-sm text-slate-600">
                    {comment.body}
                  </p>
                  <div className="mt-2 flex items-center gap-4 pl-9 text-xs text-slate-500">
                    <form action={voteComment} className="contents">
                      <input
                        type="hidden"
                        name="commentId"
                        value={comment._id}
                      />
                      <input type="hidden" name="slug" value={post.slug} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 transition-colors hover:text-[#2F80C2]"
                        aria-label="Upvote comment"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {comment.upvotes ?? 0}
                      </button>
                    </form>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reply
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <CommentForm postId={post._id} slug={post.slug} />
        </article>
      </div>

      <RightRail />
    </div>
  );
}

function PollBlock({
  poll,
}: {
  poll: { endsInDays: number | null; options: { text: string; votes: number }[] | null };
}) {
  const options = poll.options ?? [];
  const total = options.reduce((sum, o) => sum + (o.votes ?? 0), 0);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-xs font-medium text-slate-500">
        Poll {poll.endsInDays ? `· ends in ${poll.endsInDays} days` : ""}
      </p>
      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          const pct = total > 0 ? Math.round(((option.votes ?? 0) / total) * 100) : 0;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#2F80C2]/10"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex justify-between">
                <span>{option.text}</span>
                <span className="text-slate-400">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
