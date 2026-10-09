import Image from "next/image";

export type CommunityPhoto = {
  src: string;
  alt: string;
};

// Photos stay two-up at every screen width at a short aspect ratio, so they
// take up little vertical space on a phone. Place this at the bottom of a page.
export default function CommunityPhotos({ photos }: { photos: CommunityPhoto[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
      {photos.map((photo) => (
        <div
          key={photo.src}
          className="relative aspect-[4/3] overflow-hidden rounded-xl"
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
