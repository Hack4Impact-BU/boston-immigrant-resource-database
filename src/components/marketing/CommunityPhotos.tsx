import Image from "next/image";
import { cn } from "@/lib/utils";

export type CommunityPhoto = {
  src: string;
  alt: string;
};

// Photos stay two-up at every screen width at a short aspect ratio, so they
// take up little vertical space on a phone. Place this at the bottom of a page.
// Pass `aspectClassName` (e.g. "aspect-[3/2]") when a photo needs a different
// crop, such as a group shot with people at the edges.
export default function CommunityPhotos({
  photos,
  aspectClassName = "aspect-[4/3]",
}: {
  photos: CommunityPhoto[];
  aspectClassName?: string;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
      {photos.map((photo) => (
        <div
          key={photo.src}
          className={cn("relative overflow-hidden rounded-xl", aspectClassName)}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 50vw, 600px"
          />
        </div>
      ))}
    </div>
  );
}
