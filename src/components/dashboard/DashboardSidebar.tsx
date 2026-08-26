"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Search,
  Layers,
  MessageCircleQuestion,
  Mail,
  PanelLeft,
  MoreVertical,
} from "lucide-react";
import BirdLogo from "@/components/marketing/home/BirdLogo";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

const WORKFLOWS: NavItem[] = [
  {
    label: "Community Forum",
    href: "/forum",
    icon: Users,
    match: (p) => p.startsWith("/forum"),
  },
  { label: "Search Resources", href: "#", icon: Search },
  { label: "Saved Resources", href: "/saved", icon: Layers },
];

const HELPCENTER: NavItem[] = [
  { label: "Additional Resources", href: "#", icon: MessageCircleQuestion },
  // { label: "Contact Us", href: "#", icon: Mail },
];

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-md py-2 text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-2" : "gap-2.5 px-3",
        active
          ? "bg-[#2F80C2] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href;

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out",
        collapsed ? "w-14" : "w-[210px]",
      )}
    >
      {/* Logo + collapse */}
      <div
        className={cn(
          "flex items-center pt-4 pb-2",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!collapsed ? <BirdLogo className="h-8" /> : null}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((open) => !open)}
          className="text-slate-400 transition-colors hover:text-slate-600"
        >
          <PanelLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="flex flex-1 flex-col px-3 pt-3">
        {!collapsed ? (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Workflows
          </p>
        ) : null}
        <div className="flex flex-col gap-1">
          {WORKFLOWS.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {!collapsed ? (
          <p className="mt-auto px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Helpcenter
          </p>
        ) : (
          <div className="mt-auto" />
        )}
        <div className="flex flex-col gap-1 pb-3">
          {HELPCENTER.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4">
        <div
          className={cn(
            "flex items-center rounded-xl bg-slate-900 text-white",
            collapsed
              ? "justify-center px-2 py-2.5"
              : "justify-between gap-2 px-3 py-2.5",
          )}
          title={collapsed ? "Brooklyn Simmons" : undefined}
        >
          <div
            className={cn(
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-2",
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[11px] font-semibold">
              BS
            </span>
            {!collapsed ? (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[11px] font-bold">
                  Brooklyn Simmons
                </span>
                <span className="truncate text-[9px] text-slate-300">
                  brooklynsimmons@gmail.com
                </span>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <MoreVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
