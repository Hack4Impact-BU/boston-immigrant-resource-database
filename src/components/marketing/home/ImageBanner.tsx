import Image from "next/image";
import { client } from "@/lib/sanity";

const FALLBACK_IMAGE = "/img/about-right-2.png";

async function getImageBanner() {
  try {
    const banners = await client.fetch<{ image: string | null }[]>(
      `*[_type == "imageBanner"]{
        "image": image.asset->url
      }`,
    );
    return banners[0]?.image ?? FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export default async function ImageBanner() {
  const image = await getImageBanner();

  return (
    <section className="w-full overflow-hidden bg-white" aria-hidden="true">
      <div className="relative h-36 w-full sm:h-40 md:h-48 lg:h-52">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>
    </section>
  );
}
