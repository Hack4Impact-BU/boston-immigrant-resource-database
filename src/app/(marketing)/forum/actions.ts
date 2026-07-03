"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeClient, hasWriteToken } from "@/lib/sanity";

// NOTE: This app does not yet have authentication wired up (see src/lib/auth.ts).
// Until it does, posts/comments are attributed to a placeholder current user.
// When auth lands, replace this with the authenticated session user and verify
// authorization inside each action (Server Actions are reachable via direct POST).
const CURRENT_USER = {
  name: "Brooklyn Simmons",
  handle: "@brooklyn",
};

function ensureWritable() {
  if (!hasWriteToken) {
    throw new Error(
      "Sanity write token is missing. Set SANITY_WRITE_TOKEN in your environment to enable posting.",
    );
  }
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "post"}-${suffix}`;
}

export async function createPost(formData: FormData) {
  ensureWritable();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const isDraft = formData.get("intent") === "draft";

  if (!title) {
    throw new Error("A title is required.");
  }
  if (!isDraft && !body) {
    throw new Error("Body text is required.");
  }

  // Poll options
  const pollOptions = formData
    .getAll("pollOption")
    .map((o) => String(o).trim())
    .filter(Boolean);
  const pollDays = Number(formData.get("pollDays") ?? 0);

  // Optional media upload
  let mediaRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
  const media = formData.get("media");
  if (media instanceof File && media.size > 0) {
    const asset = await writeClient.assets.upload("image", media, {
      filename: media.name,
    });
    mediaRef = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    };
  }

  const slug = slugify(title);

  await writeClient.create({
    _type: "forumPost",
    title,
    slug: { _type: "slug", current: slug },
    authorName: CURRENT_USER.name,
    authorHandle: CURRENT_USER.handle,
    category: "Community",
    body,
    upvotes: 0,
    downvotes: 0,
    solved: false,
    isDraft,
    createdAt: new Date().toISOString(),
    ...(linkUrl ? { linkUrl } : {}),
    ...(mediaRef ? { media: mediaRef } : {}),
    ...(pollOptions.length > 0
      ? {
          poll: {
            endsInDays:
              Number.isFinite(pollDays) && pollDays > 0 ? pollDays : 5,
            options: pollOptions.map((text) => ({ text, votes: 0 })),
          },
        }
      : {}),
  });

  revalidatePath("/forum");

  if (isDraft) {
    redirect("/forum");
  }
  redirect(`/forum/${slug}`);
}

export async function addComment(formData: FormData) {
  ensureWritable();

  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId || !body) return;

  await writeClient.create({
    _type: "forumComment",
    post: { _type: "reference", _ref: postId },
    authorName: CURRENT_USER.name,
    authorHandle: CURRENT_USER.handle,
    body,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  });

  // A post with at least one answer is considered "unsolved" until marked solved.
  await writeClient
    .patch(postId)
    .setIfMissing({ solved: false })
    .commit()
    .catch(() => {});

  revalidatePath(`/forum/${slug}`);
  revalidatePath("/forum");
}

export async function votePost(formData: FormData) {
  ensureWritable();

  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const direction = String(formData.get("direction") ?? "up");

  if (!postId) return;

  const field = direction === "down" ? "downvotes" : "upvotes";

  await writeClient
    .patch(postId)
    .setIfMissing({ upvotes: 0, downvotes: 0 })
    .inc({ [field]: 1 })
    .commit();

  if (slug) revalidatePath(`/forum/${slug}`);
  revalidatePath("/forum");
}

export async function voteComment(formData: FormData) {
  ensureWritable();

  const commentId = String(formData.get("commentId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!commentId) return;

  await writeClient
    .patch(commentId)
    .setIfMissing({ upvotes: 0 })
    .inc({ upvotes: 1 })
    .commit();

  if (slug) revalidatePath(`/forum/${slug}`);
}
