"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { client } from "@/lib/sanity";

type SidebarProps = {
  isOpen: boolean;
  activePage?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activePage = "About BIRD" }) => {
  const [menuItems, setMenuItems] = useState<Array<{ name: string; icon: string; href: string }>>([]);

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        const items = await client.fetch(`*[_type == "menuItem"]{
          name,
          "icon": icon.asset->url,
          href
        }`);
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
    }

    fetchMenuItems();
  }, []);

  return (
    <div
      className={`flex flex-col h-screen bg-gradient-to-b from-[#4E61F6] to-[#2C2F8F] text-white transition-all duration-300 ease-in-out shadow-2xl ${
        isOpen ? "w-[260px]" : "w-0"
      } overflow-hidden border-r border-white/10`}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img
            src="/icons/Just_BIRD_logo_white.png"
            alt="BIRD"
            className="w-10 h-10 object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tight leading-none">BIRD</h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 mt-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activePage === item.name;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-white no-underline ${
                    isActive
                      ? "bg-white/20 backdrop-blur-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="w-5 h-5 object-contain opacity-70 filter brightness-0 invert"
                  />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section (Pinned to Bottom) */}
      <div className="p-4 mb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-400 shrink-0 border border-white/20 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Brooklyn"
                alt="User"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate leading-tight">
                Brooklyn Simmons
              </span>
              <span className="text-[9px] opacity-60 truncate">
                brooklyn@simmons.com
              </span>
            </div>
          </div>
          <MoreVertical
            size={14}
            className="opacity-40 hover:opacity-100 cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
