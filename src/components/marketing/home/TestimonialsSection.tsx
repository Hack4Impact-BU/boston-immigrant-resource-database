import Image from "next/image";
import { Star } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { TESTIMONIALS } from "./data";

function getInitials(name: string) {
  return name
    .replace(/^Rev\. |^Pastor /, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Testimonial = {
  _id?: string;
  name: string;
  title: string;
  quote: string;
  photo?: string | { asset: { _ref: string } };
};

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const testimonials = await client.fetch<Testimonial[]>(
      `*[_type == "testimonial"]{
        _id,
        name,
        title,
        quote,
        photo
      }`,
    );
    return testimonials?.length ? testimonials.slice(0, 3) : [...TESTIMONIALS.slice(0, 3)];
  } catch {
    return [...TESTIMONIALS.slice(0, 3)];
  }
}

function getPhotoSrc(testimonial: Testimonial): string | null {
  if (!testimonial.photo) return null;
  if (typeof testimonial.photo === "string") return testimonial.photo;
  return urlFor(testimonial.photo).width(128).height(128).url();
}

export default async function TestimonialsSection() {
  const testimonials = await getTestimonials();

  return (
    <section className="bg-[#f5f7fa] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <h2 className="text-center text-2xl font-bold text-bird-accent md:text-3xl">
          Testimonials
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const photoSrc = getPhotoSrc(testimonial);
            const key = testimonial._id ?? `${testimonial.name}-${index}`;

            return (
              <article
                key={key}
                className="relative rounded-2xl bg-white p-6 pt-12 shadow-sm"
              >
                <div className="absolute -top-8 left-6 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-bird-accent shadow-md">
                  {photoSrc ? (
                    <Image
                      src={photoSrc}
                      alt={testimonial.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                      {getInitials(testimonial.name)}
                    </span>
                  )}
                </div>
                <div className="mb-3 flex justify-end gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-[#9BC678] text-[#9BC678]"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-black">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-[#1a1a1a]">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-black">{testimonial.title}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
