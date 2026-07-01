import Link from "next/link";
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

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#27317B] lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="no-underline transition-colors hover:text-bird-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button
          asChild
          className="shrink-0 rounded-full bg-bird-accent px-5 text-sm font-semibold hover:bg-bird-accent-hover"
        >
          <Link href="#contact">Donate</Link>
        </Button>
      </div>
    </header>
  );
}
