import { ThumbsUp, ThumbsDown, MessageSquare, Share2 } from "lucide-react";
import { votePost } from "@/app/(marketing)/forum/actions";

export default function VoteButtons({
  postId,
  slug,
  upvotes,
  downvotes,
  commentCount,
}: {
  postId: string;
  slug: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-slate-600">
      <form action={votePost} className="contents">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="direction" value="up" />
        <button
          type="submit"
          className="flex items-center gap-1.5 transition-colors hover:text-[#2F80C2]"
          aria-label="Upvote"
        >
          <ThumbsUp className="h-4 w-4" />
          {upvotes}
        </button>
      </form>

      <form action={votePost} className="contents">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          className="flex items-center gap-1.5 transition-colors hover:text-[#2F80C2]"
          aria-label="Downvote"
        >
          <ThumbsDown className="h-4 w-4" />
          {downvotes}
        </button>
      </form>

      <span className="flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4" />
        {commentCount}
      </span>

      <button
        type="button"
        className="flex items-center gap-1.5 transition-colors hover:text-[#2F80C2]"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
