import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Scan to visit BIRD",
  // A utility page for presentations: nothing here is worth finding through a search engine.
  robots: { index: false, follow: false },
};

// A full-screen QR code for presenting BIRD: the same QR code (and the same destination) as the one in the homepage
// footer, shown as large as the screen allows. The page is always white, whatever the theme, so the QR code keeps the
// plain light surround that scanners need.
export default function QrPage() {
  return (
    <main className="flex h-dvh flex-col items-center bg-white p-4 text-slate-900">
      <div className="relative min-h-0 w-full flex-1">
        {/* unoptimized: serve the original PNG. Next's image optimizer re-encodes to a lossy format, which softens the
            sharp module edges a scanner relies on. object-contain keeps it square and as big as the space allows. */}
        <Image
          src="/img/bird-website-qr-code.png"
          alt="QR code linking to the BIRD website"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain"
        />
      </div>
      <p className="pt-3 text-center text-[clamp(1.25rem,3.5vmin,3rem)] font-semibold leading-tight">birdboston.org</p>
    </main>
  );
}
