import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import { PARTNER_LOGOS } from "./data";
import { getMarketingPageContent } from "@/lib/marketing-content";

export default async function SponsorLogos() {
  const { partnerLogos } = await getMarketingPageContent();
  const sanityLogos = partnerLogos;

  return (
    <section id="services" className="border-y border-gray-100 bg-white py-14 sm:py-16">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-center gap-10 px-6 sm:gap-12 md:gap-16 lg:justify-between lg:px-20 xl:px-28">
        {sanityLogos
          ? sanityLogos.map((logo) => (
              <div key={logo._id} className="flex h-28 items-center justify-center sm:h-32">
                {logo.logo ? (
                  <Image
                    src={urlFor(logo.logo).width(1440).height(512).url()}
                    alt={logo.alt ?? ""}
                    width={440}
                    height={160}
                    className="max-h-28 w-auto object-contain opacity-80 sm:max-h-32"
                  />
                ) : null}
              </div>
            ))
          : PARTNER_LOGOS.map((logo) => (
              <div
                key={logo.alt}
                className="flex h-28 items-center justify-center px-4 sm:h-32"
              >
                <span className="text-center text-base font-semibold tracking-wide text-slate-500 sm:text-lg">
                  {logo.alt}
                </span>
              </div>
            ))}
      </div>
    </section>
  );
}
