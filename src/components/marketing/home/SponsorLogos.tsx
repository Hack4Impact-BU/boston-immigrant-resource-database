import Image from "next/image";
import { client, urlFor } from "@/lib/sanity";
import { PARTNER_LOGOS } from "./data";

async function getPartnerLogos() {
  try {
    const logos = await client.fetch<
      { _id: string; alt: string; logo?: { asset: { _ref: string } } }[]
    >(`*[_type == "partnerLogo"]{
      _id,
      alt,
      logo
    }`);
    return logos?.length ? logos : null;
  } catch {
    return null;
  }
}

export default async function SponsorLogos() {
  const sanityLogos = await getPartnerLogos();

  return (
    <section id="services" className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-center gap-12 px-6 sm:gap-16 md:gap-20 lg:justify-between lg:px-20 xl:px-28">
        {sanityLogos
          ? sanityLogos.map((logo) => (
              <div key={logo._id} className="flex h-16 items-center justify-center">
                {logo.logo ? (
                  <Image
                    src={urlFor(logo.logo).width(360).height(128).url()}
                    alt={logo.alt ?? ""}
                    width={180}
                    height={64}
                    className="max-h-16 w-auto object-contain opacity-80 grayscale"
                  />
                ) : null}
              </div>
            ))
          : PARTNER_LOGOS.map((logo) => (
              <div
                key={logo.alt}
                className="flex h-16 items-center justify-center px-4"
              >
                <span className="text-center text-sm font-semibold tracking-wide text-slate-500">
                  {logo.alt}
                </span>
              </div>
            ))}
      </div>
    </section>
  );
}
