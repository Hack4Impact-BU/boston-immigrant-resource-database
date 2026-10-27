import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BirdLogo from "./BirdLogo";
import ImmigrationGptLink from "./ImmigrationGptLink";

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
      {/* On a phone the logo is smaller and the sides tighter, and the links (Immigration GPT, Contact Us, Sign In) shrink and close up so
          that all three fit on the one row with the logo. The text sizes are the largest that fit at each width (measured, with a little
          to spare, because phone fonts vary): 11px below 360px, 12px, 13px from 375px, and the usual 14px from 390px. The arrow beside
          Sign In needs room, so it is back from 430px. From sm (640px) up everything is as it always was. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-10">
        <BirdLogo className="h-8 w-auto min-[340px]:h-10 sm:h-14" />

        <nav className="flex items-center gap-1 text-[11px] font-medium text-[#27317B] min-[360px]:text-xs min-[375px]:text-[13px] min-[390px]:text-sm min-[412px]:gap-2 sm:gap-6">
          <ImmigrationGptLink />
          |
          <Link href="/#contact" className="whitespace-nowrap no-underline hover:text-bird-accent max-sm:py-2">
            Contact Us
          </Link>
          <span className="hidden md:contents">
            |
            <Link href="/register" className="no-underline hover:text-bird-accent">
              Create Account
            </Link>
          </span>
          |
          <Link href="/login" className="flex items-center gap-1 whitespace-nowrap no-underline hover:text-bird-accent max-sm:py-2">
            Sign In
            <ChevronRight className="hidden h-4 w-4 min-[430px]:block" />
          </Link>
        </nav>

      </div>
    </header>
  );
}
