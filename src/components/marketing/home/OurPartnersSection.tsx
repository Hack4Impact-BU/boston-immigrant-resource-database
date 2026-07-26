import Image from "next/image";
import { Button } from "@/components/ui/button";
import { client, urlFor } from "@/lib/sanity";

const FALLBACK = {
  heading: "Our Partners",
  paragraph:
    "UniteBoston connects immigrant-serving organizations, faith communities, and city partners to share real-time resource information—so every neighbor can find help when they need it most.",
  buttonText: "Learn More",
  buttonLink: "#contact",
  image: "/img/partners-photo.png",
};

async function getPartnersSection() {
  try {
    const sections = await client.fetch<
      {
        heading: string;
        paragraph: string;
        buttonText: string;
        buttonLink: string;
        image?: { asset: { _ref: string } };
      }[]
    >(`*[_type == "partnersSection"]{
      heading,
      paragraph,
      buttonText,
      buttonLink,
      image
    }`);
    return sections[0] ?? null;
  } catch {
    return null;
  }
}

export default async function OurPartnersSection() {
  const section = (await getPartnersSection()) ?? FALLBACK;
  const imageSource = section.image ?? FALLBACK.image;
  const imageUrl = typeof imageSource === "string"
    ? imageSource
    : urlFor(imageSource).width(1080).url();

  return (
    <section id="mission" className="bg-[#f5f7fa] py-20 md:py-28">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 px-6 md:gap-8 lg:grid-cols-2 lg:items-stretch lg:px-14">
        <div className="flex min-h-90 flex-col justify-between rounded-3xl bg-white p-10 shadow-sm md:min-h-100 md:p-12 lg:min-h-110">
          <div>
            <h2 className="text-3xl font-bold text-bird-accent md:text-4xl">
              {section.heading}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-black md:text-lg">
              {section.paragraph}
            </p>
          </div>
          <Button
            asChild
            className="mt-10 h-12 w-fit rounded-full bg-bird-accent px-8 text-base hover:bg-bird-accent-hover md:h-14 md:px-10"
          >
            <a href={section.buttonLink ?? "#contact"}>
              {section.buttonText ?? "Learn More"}
            </a>
          </Button>
        </div>
        <div className="relative min-h-90 overflow-hidden rounded-3xl md:min-h-100 lg:min-h-110">
          <Image
            src={imageUrl}
            alt="A woman and young girl smiling together"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 540px"
          />
        </div>
      </div>
    </section>
  );
}
