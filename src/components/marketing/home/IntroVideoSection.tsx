import Image from "next/image";

// Placeholder content — swap these once the real video and photos are provided.
// YOUTUBE_VIDEO_ID is just the id from a youtube.com/watch?v=<id> URL.
const YOUTUBE_VIDEO_ID = "IqpaiFw6K8I";
const SIDE_PHOTOS = [
//TODO
  { src: "/img/you-belong-here-mayor-michelle-wu.jpg", alt: "You Belong Here - Michelle Wu" },
  { src: "/img/bird-provider-meet-and-greet.jpg", alt: "BIRD Provider Meet & Greet" },
] as const;

export default function IntroVideoSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="The Boston Immigrant Resource Dashboard: You Belong Here"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:grid-rows-2">
            {SIDE_PHOTOS.map((photo) => (
              <div key={photo.src} className="relative aspect-video overflow-hidden rounded-2xl lg:aspect-auto">
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 280px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
