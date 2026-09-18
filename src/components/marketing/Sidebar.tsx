"use client";

import React, { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Users, Search, Plus, Mail, Briefcase, Building2, MessageSquare } from "lucide-react";
import BirdLogo from "./home/BirdLogo";

type SidebarProps = {
  isOpen: boolean;
  activePage?: string;
};

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activePage = "About BIRD" }) => {
  const { user } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizationName() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { organizationName?: string | null; userRole?: string | null };

        if (!cancelled) {
          setDisplayName(data.organizationName?.trim() || "");
          setUserRole(data.userRole ?? null);
        }
      } catch {
        if (!cancelled) {
          setDisplayName("");
          setUserRole(null);
        }
      }
    }

    loadOrganizationName();

    return () => {
      cancelled = true;
    };
  }, []);

  const browseItems: MenuItem[] = [
    { name: "Community Forum", href: "/forum", icon: <Users size={20} /> },
    { name: "Providers", href: "/providers", icon: <Building2 size={20} /> },
    { name: "Search Services", href: "/map", icon: <Search size={20} /> },
  ];

  const manageItems: MenuItem[] = [
    // Only Provider-role accounts manage a Provider profile — Admins already
    // have a path to edit any Provider directly from its own page, and
    // Viewers don't offer Services at all.
    ...(userRole === "Provider"
      ? [{ name: "Manage My Provider", href: "/providers/manage", icon: <Building2 size={20} /> }]
      : []),
    // Admins manage any Provider's Services directly from that Provider's own
    // page now, so this "my own Provider only" shortcut doesn't apply to them
    // either — same reasoning as Manage My Provider above.
    ...(userRole === "Provider"
      ? [{ name: "Manage My Services", href: "/services/manage", icon: <Briefcase size={20} /> }]
      : []),
  ];

  const helpcenterItems: MenuItem[] = [
    { name: "Support / Feedback", href: "/feedback", icon: <MessageSquare size={20} /> },
    { name: "Additional Resources", href: "/resources", icon: <Plus size={20} /> },
    // { name: "Contact Us", href: "/contact", icon: <Mail size={20} /> },
  ];

  return (
    <div
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col bg-white text-slate-900 transition-all duration-300 ease-in-out shadow-lg border-r border-slate-200 ${
        isOpen ? "w-55" : "w-0"
      } overflow-hidden`}
    >
      {/* Logo Section */}
      <div className="p-1 flex items-center gap-2 border-b border-slate-200">
        <div className="flex items-center justify-center shrink-0">
          <BirdLogo/>
        </div>
      </div>

      {/* Workflows Section */}
      <nav className="px-3 py-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
          Workflows
        </h3>
        <ul className="space-y-2">
          {browseItems.map((item) => {
            const isActive = activePage === item.name;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium no-underline ${
                    isActive
                      ? "bg-[#5B8FD4] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {manageItems.length > 0 ? (
          <>
            <div className="my-3 border-t border-slate-200" />
            <ul className="space-y-2">
              {manageItems.map((item) => {
                const isActive = activePage === item.name;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium no-underline ${
                        isActive
                          ? "bg-[#5B8FD4] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </nav>

      {/* Spacer - pushes Help Center to bottom */}
      <div className="flex-1"></div>

      {/* Help Center Section */}
      <nav className="px-3 py-4 border-t border-slate-200">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
          Help Center
        </h3>
        <ul className="space-y-2">
          {helpcenterItems.map((item) => {
            const isActive = activePage === item.name;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium no-underline ${
                    isActive
                      ? "bg-[#5B8FD4] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section (Pinned to Bottom) */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                  userButtonTrigger:
                    "rounded-full focus:shadow-none focus:ring-2 focus:ring-[#5B8FD4]",
                },
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate leading-tight text-slate-900">
                {displayName || ""}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress || "Signed in"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
