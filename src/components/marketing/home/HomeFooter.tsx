import Link from "next/link";
import { Mail } from "lucide-react";

import BirdLogo from "./BirdLogo";

const SOCIAL_LINKS = [
  {
    label: "Email",
    href: "mailto:info@uniteboston.com",
    icon: <Mail className="h-4 w-4" aria-hidden />,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/uniteboston10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/uniteboston",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@uniteboston",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M23.498 6.186a2.979 2.979 0 0 0-2.096-2.105C19.505 3.6 12 3.6 12 3.6s-7.505 0-9.402.481A2.979 2.979 0 0 0 .502 6.186 31.31 31.31 0 0 0 0 12a31.31 31.31 0 0 0 .502 5.814 2.979 2.979 0 0 0 2.096 2.105c1.897.481 9.402.481 9.402.481s7.505 0 9.402-.481a2.979 2.979 0 0 0 2.096-2.105A31.31 31.31 0 0 0 24 12a31.31 31.31 0 0 0-.502-5.814ZM9.6 15.6V8.4L15.6 12l-6 3.6Z" />
      </svg>
    ),
  },
] as const;

export default async function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#27317B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-5">
            <BirdLogo variant="light" href={undefined} />
            <p className="max-w-md text-sm leading-6 text-white/75">
              Unite Boston connects immigrant-serving organizations, faith communities, and city partners so people can find the right support faster.
            </p>

            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:border-white/30 hover:bg-white/20"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs leading-5 text-white/55 md:max-w-xs md:text-right">
            &copy; {new Date().getFullYear()} Unite Boston. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}