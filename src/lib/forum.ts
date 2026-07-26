import { client } from "@/lib/sanity";

export type ForumTab = "recent" | "unanswered" | "unsolved" | "solved";

export type PollOption = {
  text: string;
  votes: number;
};

export type ForumPostListItem = {
  _id: string;
  title: string;
  slug: string;
  authorName: string | null;
  authorHandle: string | null;
  category: string | null;
  body: string | null;
  upvotes: number | null;
  downvotes: number | null;
  solved: boolean | null;
  createdAt: string | null;
  commentCount: number;
};

export type ForumComment = {
  _id: string;
  authorName: string | null;
  authorHandle: string | null;
  body: string;
  upvotes: number | null;
  createdAt: string | null;
};

export type ForumPostDetail = ForumPostListItem & {
  linkUrl: string | null;
  mediaUrl: string | null;
  poll: {
    endsInDays: number | null;
    options: PollOption[] | null;
  } | null;
  comments: ForumComment[];
};

export type ForumSettings = {
  importantLinks: { label: string; href: string }[];
  rules: string[];
};

const POST_LIST_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  authorName,
  authorHandle,
  category,
  body,
  upvotes,
  downvotes,
  solved,
  createdAt,
  "commentCount": count(*[_type == "forumComment" && references(^._id)])
`;

function tabFilter(tab: ForumTab): string {
  switch (tab) {
    case "unanswered":
      return `&& count(*[_type == "forumComment" && references(^._id)]) == 0`;
    case "unsolved":
      return `&& solved != true && count(*[_type == "forumComment" && references(^._id)]) > 0`;
    case "solved":
      return `&& solved == true`;
    case "recent":
    default:
      return ``;
  }
}

export async function getForumPosts(
  tab: ForumTab = "recent",
): Promise<ForumPostListItem[]> {
  const query = `*[_type == "forumPost" && isDraft != true ${tabFilter(
    tab,
  )}] | order(coalesce(createdAt, _createdAt) desc) {
    ${POST_LIST_FIELDS}
  }`;

  try {
    return await client.fetch(query);
  } catch (error) {
    console.error("Failed to fetch forum posts:", error);
    return [];
  }
}

export async function getForumPost(
  slug: string,
): Promise<ForumPostDetail | null> {
  const query = `*[_type == "forumPost" && slug.current == $slug][0]{
    ${POST_LIST_FIELDS},
    linkUrl,
    "mediaUrl": media.asset->url,
    poll,
    "comments": *[_type == "forumComment" && references(^._id)] | order(coalesce(createdAt, _createdAt) desc) {
      _id,
      authorName,
      authorHandle,
      body,
      upvotes,
      createdAt
    }
  }`;

  try {
    return await client.fetch(query, { slug });
  } catch (error) {
    console.error("Failed to fetch forum post:", error);
    return null;
  }
}

const DEFAULT_SETTINGS: ForumSettings = {
  importantLinks: [
    { label: "All unanswered Topics", href: "/forum?tab=unanswered" },
    { label: "Community Guidelines", href: "#" },
  ],
  rules: [
    "Prioritize Privacy: Keep client data completely anonymous and don't share on public platforms.",
    "Keep Information Accurate: Only share verified updates and policy shifts.",
    "Cultivate SoNo profanitylidarity: We are here to collaborate and problem-solve to support our collective work.",
  ],
};

export async function getForumSettings(): Promise<ForumSettings> {
  try {
    const settings = await client.fetch<ForumSettings | null>(
      `*[_type == "forumSettings"][0]{
        "importantLinks": coalesce(importantLinks, []),
        "rules": coalesce(rules, [])
      }`,
    );

    if (!settings) return DEFAULT_SETTINGS;

    return {
      importantLinks: settings.importantLinks?.length
        ? settings.importantLinks
        : DEFAULT_SETTINGS.importantLinks,
      rules: settings.rules?.length ? settings.rules : DEFAULT_SETTINGS.rules,
    };
  } catch (error) {
    console.error("Failed to fetch forum settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";

  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
