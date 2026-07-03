"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Plus, UploadCloud, X, ChevronDown } from "lucide-react";
import { createPost } from "@/app/(marketing)/forum/actions";

function SubmitButton({
  intent,
  variant,
  children,
}: {
  intent: "post" | "draft";
  variant: "solid" | "soft";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      className={
        variant === "solid"
          ? "rounded-md bg-[#2F80C2] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256aa3] disabled:opacity-60"
          : "rounded-md bg-[#2F80C2]/90 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256aa3] disabled:opacity-60"
      }
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export default function CreatePostForm() {
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [showPoll, setShowPoll] = useState(true);
  const [pollDays, setPollDays] = useState(5);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={createPost}>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-5 text-sm font-bold text-[#2F80C2]">
          Basic information
        </h3>

        {/* Title */}
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Title
        </label>
        <input
          name="title"
          required
          placeholder="Write the title"
          className="mb-5 h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2F80C2] focus:outline-none focus:ring-2 focus:ring-[#2F80C2]/20"
        />

        {/* Body */}
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          What would you like to ask?
        </label>
        <textarea
          name="body"
          rows={5}
          placeholder="Body text *"
          className="mb-5 w-full resize-none rounded-md border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2F80C2] focus:outline-none focus:ring-2 focus:ring-[#2F80C2]/20"
        />

        {/* Link & Media */}
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Link &amp; Media
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-4 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 text-sm text-slate-400 transition-colors hover:border-[#2F80C2]"
        >
          <UploadCloud className="h-5 w-5" />
          {fileName ? (
            <span className="text-slate-600">{fileName}</span>
          ) : (
            <span>Drag and Drop or upload media</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          name="media"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />

        {/* Link URL */}
        <input
          name="linkUrl"
          type="url"
          placeholder="Link URL *"
          className="mb-5 h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2F80C2] focus:outline-none focus:ring-2 focus:ring-[#2F80C2]/20"
        />

        {/* Poll */}
        {showPoll ? (
          <div className="rounded-md border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <span>Poll ends in</span>
                <div className="relative">
                  <select
                    value={pollDays}
                    onChange={(e) => setPollDays(Number(e.target.value))}
                    className="appearance-none rounded border border-slate-200 bg-white py-1 pl-2 pr-7 text-sm focus:outline-none"
                  >
                    {[1, 3, 5, 7, 14].map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <button
                type="button"
                aria-label="Remove poll"
                onClick={() => setShowPoll(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input type="hidden" name="pollDays" value={pollDays} />

            <div className="flex flex-col gap-2">
              {pollOptions.map((value, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2"
                >
                  <Plus className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    name="pollOption"
                    value={value}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder="Add option"
                    className="flex-1 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                  />
                  {pollOptions.length > 2 ? (
                    <button
                      type="button"
                      aria-label="Remove option"
                      onClick={() =>
                        setPollOptions(pollOptions.filter((_, j) => j !== i))
                      }
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="self-start text-xs font-medium text-[#2F80C2]"
              >
                + Add option
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPoll(true)}
            className="text-sm font-medium text-[#2F80C2]"
          >
            + Add a poll
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-5 flex items-center justify-between">
        <Link
          href="/forum"
          className="rounded-md bg-[#2F80C2] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256aa3]"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <SubmitButton intent="post" variant="solid">
            Finish and Post
          </SubmitButton>
          {/* <SubmitButton intent="draft" variant="soft">
            Save Draft
          </SubmitButton> */}
        </div>
      </div>
    </form>
  );
}
