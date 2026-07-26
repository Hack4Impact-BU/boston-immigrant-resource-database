import Image from "next/image";

const BANNER_IMAGE = "/img/group_photo.png";

export default async function ImageBanner() {
  const repeatedPanels = Array.from({ length: 4 }, (_, index) => index);

  return (
    <section className="w-full overflow-hidden bg-white" aria-hidden="true">
      <div className="flex w-full gap-0">
        {repeatedPanels.map((panelIndex) => (
          <div key={panelIndex} className="relative h-32 min-w-0 flex-1 sm:h-36 md:h-40 lg:h-44 xl:h-48">
            <Image
              src={BANNER_IMAGE}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={panelIndex === 0}
            />
            <div className="absolute inset-0 bg-white/18" />
          </div>
        ))}
      </div>
    </section>
  );
}
