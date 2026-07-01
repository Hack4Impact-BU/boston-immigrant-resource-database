import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HERO_IMAGES = [
  { src: "/img/about-right-1.png", alt: "Community members holding multilingual belonging posters" },
  { src: "/img/about-right-2.png", alt: "Outdoor community outreach event with banners" },
  { src: "/img/about-right-3.png", alt: "Group posing with Boston belonging banner" },
  { src: "/img/partners-photo.png", alt: "A woman and young girl smiling together" },
] as const;

export default function AboutBirdSection() {
  return (
    <section id="about" className="overflow-hidden bg-gradient-to-r from-[#e8f5f0] to-[#e3f2fd]">
      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="shrink-0 space-y-6 lg:max-w-md lg:pr-8">
            <div>
              <h1 className="text-3xl font-bold text-[#27317B] md:text-4xl">About BIRD</h1>
              <p className="mt-2 text-lg font-semibold text-bird-accent">
                Boston Immigrant Resource Dashboard
              </p>
            </div>
            <p className="text-sm leading-relaxed text-black md:text-base">
              To provide real-time, accessible information on essential resources for immigrants,
              refugees, and service providers—ensuring timely and effective support. To foster a
              &ldquo;city of belonging&rdquo; by creating a more connected and efficient support
              network for immigrants, refugees, and asylum seekers in Boston.
            </p>
            <Button
              asChild
              className="rounded-full bg-bird-accent px-8 py-5 text-sm font-semibold hover:bg-bird-accent-hover"
            >
              <Link href="/login">Activate your Account</Link>
            </Button>
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-3">
              {HERO_IMAGES.map((image) => (
                <div
                  key={image.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 280px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
