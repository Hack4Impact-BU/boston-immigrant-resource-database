"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { Users, Search, Plus, Mail } from "lucide-react";

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
  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    user?.fullName || user?.username || email?.split("@")[0] || "Account";

  const workflowItems: MenuItem[] = [
    { name: "Community Forum", href: "/forum", icon: <Users size={20} /> },
    { name: "Search Resources", href: "/map", icon: <Search size={20} /> },
  ];

  const helpcenterItems: MenuItem[] = [
    { name: "Additional Resources", href: "/resources", icon: <Plus size={20} /> },
    { name: "Contact us", href: "/contact", icon: <Mail size={20} /> },
  ];

  return (
    <div
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col bg-white text-slate-900 transition-all duration-300 ease-in-out shadow-lg border-r border-slate-200 ${
        isOpen ? "w-52" : "w-0"
      } overflow-hidden`}
    >
      {/* Logo Section */}
      <div className="p-1 flex items-center gap-2 border-b border-slate-200">
        <div className="flex items-center justify-center shrink-0">
          <img
            src="/icons/BIRDLogo_Blue.svg"
            alt="BIRD"
            className="w-14 object-contain"
          />
        </div>
      </div>

      {/* Workflows Section */}
      <nav className="px-3 py-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
          Workflows
        </h3>
        <ul className="space-y-2">
          {workflowItems.map((item) => {
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

      {/* Spacer - pushes Helpcenter to bottom */}
      <div className="flex-1"></div>

      {/* Helpcenter Section */}
      <nav className="px-3 py-4 border-t border-slate-200">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
          Helpcenter
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
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{email || "Signed in"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
