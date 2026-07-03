import { Plus, Smile, ChevronUp } from "lucide-react";
import { addComment } from "@/app/(marketing)/forum/actions";

export default function CommentForm({
  postId,
  slug,
}: {
  postId: string;
  slug: string;
}) {
  return (
    <form
      action={addComment}
      className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4"
    >
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <span className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-slate-100" />

      <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
        <Plus className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          name="body"
          required
          placeholder="Write a comment..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        <Smile className="h-4 w-4 shrink-0 text-slate-400" />
        <button
          type="submit"
          aria-label="Post comment"
          className="text-slate-400 transition-colors hover:text-[#2F80C2]"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
