import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import BirdLogo from "./BirdLogo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#about" },
  { label: "Our Partners", href: "#mission" },
  { label: "Services", href: "#services" },
  { label: "Forum", href: "/forum" },
  { label: "Contact", href: "#contact" },
] as const;

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <BirdLogo />

        <nav className="flex items-center gap-6 text-sm font-medium text-[#27317B]">
          <Link
            href="https://immigrationgpt.org/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 no-underline"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[#27317B]">Immigration GPT</span>
              <span className="max-w-[240px] whitespace-normal text-xs font-normal text-slate-500">
                Free help finding resources and answers for immigrants and refugees
              </span>
            </div>
          </Link>
          |
          <Link href="/#contact" className="no-underline hover:text-bird-accent">
            Contact Us
          </Link>
          |
          <Link href="/register" className="no-underline hover:text-bird-accent">
            Create Account
          </Link>
          |
          <Link href="/login" className="flex items-center gap-1 no-underline hover:text-bird-accent">
            Sign In
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>

      </div>
    </header>
  );
}
