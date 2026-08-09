import { unstable_cache } from "next/cache";
import { client } from "@/lib/sanity";
import { GENERAL_FAQ, STATS, TESTIMONIALS } from "@/components/marketing/home/data";

export const revalidate = 300;

export type HomePageStats = {
  value: string;
  label: string;
  icon: string;
};

export type HomePageFaq = {
  _id?: string;
  trigger: string;
  content: string;
};

export type HomePageTestimonial = {
  _id?: string;
  name: string;
  title: string;
  quote: string;
  photo?: string | { asset: { _ref: string } };
};

export type HomePagePartnersSection = {
  heading: string;
  paragraph: string;
  buttonText: string;
  buttonLink: string;
  image?: { asset: { _ref: string } } | string | null;
};

export type HomePagePartnerLogo = {
  _id: string;
  alt: string;
  logo?: { asset: { _ref: string } };
};

export type HomePageContent = {
  stats: HomePageStats[];
  faqs: HomePageFaq[];
  testimonials: HomePageTestimonial[];
  partnersSection: HomePagePartnersSection | null;
  partnerLogos: HomePagePartnerLogo[] | null;
  imageBanner: string;
};

const FALLBACK_CONTENT: HomePageContent = {
  stats: [...STATS],
  faqs: [...GENERAL_FAQ],
  testimonials: [...TESTIMONIALS].slice(0, 3),
  partnersSection: null,
  partnerLogos: [],
  imageBanner: "/img/about-right-2.png",
};

export const getMarketingPageContent = unstable_cache(async (): Promise<HomePageContent> => {
  try {
    const data = await client.fetch<{
      stats?: HomePageStats[];
      faqs?: HomePageFaq[];
      testimonials?: HomePageTestimonial[];
      partnersSection?: HomePagePartnersSection | null;
      partnerLogos?: HomePagePartnerLogo[] | null;
      imageBanner?: { image?: string | null } | null;
    }>(`{
      "stats": *[_type == "stat"] | order(_createdAt asc) {
        value,
        label,
        icon
      },
      "faqs": *[_type == "faqItem" && section == "general"] {
        _id,
        trigger,
        content
      },
      "testimonials": *[_type == "testimonial"] | order(_createdAt desc)[0...3] {
        _id,
        name,
        title,
        quote,
        photo
      },
      "partnersSection": *[_type == "partnersSection"][0] {
        heading,
        paragraph,
        buttonText,
        buttonLink,
        image
      },
      "partnerLogos": *[_type == "partnerLogo"] | order(_createdAt asc) {
        _id,
        alt,
        logo
      },
      "imageBanner": *[_type == "imageBanner"][0] {
        "image": image.asset->url
      }
    }`);

    return {
      stats: data?.stats?.length ? data.stats : [...STATS],
      faqs: data?.faqs?.length ? data.faqs : [...GENERAL_FAQ],
      testimonials: data?.testimonials?.length ? data.testimonials : [...TESTIMONIALS].slice(0, 3),
      partnersSection: data?.partnersSection ?? null,
      partnerLogos: data?.partnerLogos ?? [],
      imageBanner: data?.imageBanner?.image ?? "/img/about-right-2.png",
    };
  } catch {
    return FALLBACK_CONTENT;
  }
});
