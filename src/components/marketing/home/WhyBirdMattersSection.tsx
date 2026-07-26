import { FileText, Globe, Users, UsersRound } from "lucide-react";
import { getMarketingPageContent } from "@/lib/marketing-content";

const ICONS = {
  users: Users,
  globe: Globe,
  community: UsersRound,
  resources: FileText,
} as const;

function normalizeIconKey(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z]/g, "") || "";
}

function getIconKey(stat: { icon?: string; label: string }) {
  const normalizedIcon = normalizeIconKey(stat.icon);
  if (normalizedIcon in ICONS) {
    return normalizedIcon as keyof typeof ICONS;
  }

  const normalizedLabel = stat.label.toLowerCase();
  if (normalizedLabel.includes("year") || normalizedLabel.includes("experience")) {
    return "globe";
  }

  if (normalizedLabel.includes("resource")) {
    return "resources";
  }

  if (normalizedLabel.includes("service") || normalizedLabel.includes("location")) {
    return "community";
  }

  return "users";
}

export default async function WhyBirdMattersSection() {
  const { stats } = await getMarketingPageContent();

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 text-center lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-bird-accent">
          Our Purpose
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[#27317B] md:text-4xl">
          Why BIRD Matters
        </h2>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = ICONS[getIconKey(stat)];
            return (
              <div key={stat.label} className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#27317B] text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
                <p className="max-w-45 text-sm text-black">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
