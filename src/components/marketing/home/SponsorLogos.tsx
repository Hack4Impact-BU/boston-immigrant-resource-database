import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import { PARTNER_LOGOS } from "./data";
import { getMarketingPageContent } from "@/lib/marketing-content";

export default async function SponsorLogos() {
  const { partnerLogos } = await getMarketingPageContent();
  const sanityLogos = partnerLogos ?? [];

  return (
    <section id="services" className="border-y border-gray-100 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-20 xl:px-28">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 md:gap-12">
          {sanityLogos.length > 0
            ? sanityLogos.map((logo) => (
                <div
                  key={logo._id ?? logo.alt ?? (logo as any).url}
                  className="relative flex h-20 w-40 items-center justify-center sm:h-24 sm:w-48"
                >
                  {logo.logo ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={urlFor(logo.logo).width(1200).url()}
                        alt={logo.alt ?? ""}
                        fill
                        className="object-contain opacity-90"
                        sizes="(max-width: 640px) 160px, 192px"
                      />
                    </div>
                  ) : logo.url ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={logo.url}
                        alt={logo.alt ?? ""}
                        fill
                        className="object-contain opacity-90"
                        sizes="(max-width: 640px) 160px, 192px"
                      />
                    </div>
                  ) : (
                    <span className="text-center text-base font-semibold tracking-wide text-slate-500 sm:text-lg">
                      {logo.alt ?? "Partner"}
                    </span>
                  )}
                </div>
              ))
            : PARTNER_LOGOS.map((logo) => (
                <div key={logo.alt} className="relative h-20 w-40 sm:h-24 sm:w-48">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    fill
                    className="object-contain opacity-90"
                    sizes="(max-width: 640px) 160px, 192px"
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
