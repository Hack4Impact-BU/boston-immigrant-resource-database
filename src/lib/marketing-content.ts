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
  url?: string | null;
};

export type HomePageAboutSection = {
  heading: string;
  subheading: string;
  paragraph: string;
  buttonText: string;
  buttonLink: string;
  images: Array<{ asset: { _ref: string } } | string | null>;
};

export type HomePageContent = {
  stats: HomePageStats[];
  faqs: HomePageFaq[];
  testimonials: HomePageTestimonial[];
  partnersSection: HomePagePartnersSection | null;
  partnerLogos: HomePagePartnerLogo[] | null;
  imageBanner: string;
  aboutSection: HomePageAboutSection | null;
};

const FALLBACK_ABOUT_SECTION: HomePageAboutSection = {
  heading: "About BIRD",
  subheading: "Boston Immigrant Resource Dashboard",
  paragraph:
    "To provide real-time, accessible information on essential resources for immigrants, refugees, and service providers—ensuring timely and effective support. To foster a “city of belonging” by creating a more connected and efficient support network for immigrants, refugees, and asylum seekers in Boston.",
  buttonText: "Activate your Account",
  buttonLink: "/register",
  images: [],
};

export const getAboutSectionContent = unstable_cache(async (): Promise<HomePageAboutSection> => {
  try {
    const data = await client.fetch<{
      heading?: string;
      subheading?: string;
      paragraph?: string;
      buttonText?: string;
      buttonLink?: string;
      images?: Array<{ asset: { _ref: string } } | string | null> | null;
    }>(`*[_type == "aboutSection"][0] {
      heading,
      subheading,
      paragraph,
      buttonText,
      buttonLink,
      "images": [image1, image2, image3, image4, image5]
    }`);

    return {
      heading: data?.heading ?? FALLBACK_ABOUT_SECTION.heading,
      subheading: data?.subheading ?? FALLBACK_ABOUT_SECTION.subheading,
      paragraph: data?.paragraph ?? FALLBACK_ABOUT_SECTION.paragraph,
      buttonText: data?.buttonText ?? FALLBACK_ABOUT_SECTION.buttonText,
      buttonLink: data?.buttonLink ?? FALLBACK_ABOUT_SECTION.buttonLink,
      images: data?.images ?? [],
    };
  } catch {
    return FALLBACK_ABOUT_SECTION;
  }
});

const FALLBACK_CONTENT: HomePageContent = {
  stats: [...STATS],
  faqs: [...GENERAL_FAQ],
  testimonials: [...TESTIMONIALS].slice(0, 3),
  partnersSection: null,
  partnerLogos: [],
  imageBanner: "/img/about-right-2.png",
  aboutSection: FALLBACK_ABOUT_SECTION,
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
      aboutSection?: HomePageAboutSection | null;
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
        logo,
        "url": logo.asset->url
      },
      "imageBanner": *[_type == "imageBanner"][0] {
        "image": image.asset->url
      },
      "aboutSection": *[_type == "aboutSection"][0] {
        heading,
        subheading,
        paragraph,
        buttonText,
        buttonLink,
        "images": [image1, image2, image3, image4, image5]
      }
    }`);

    return {
      stats: data?.stats?.length ? data.stats : [...STATS],
      faqs: data?.faqs?.length ? data.faqs : [...GENERAL_FAQ],
      testimonials: data?.testimonials?.length ? data.testimonials : [...TESTIMONIALS].slice(0, 3),
      partnersSection: data?.partnersSection ?? null,
      partnerLogos: data?.partnerLogos ?? [],
      imageBanner: data?.imageBanner?.image ?? "/img/about-right-2.png",
      aboutSection: data?.aboutSection ?? FALLBACK_ABOUT_SECTION,
    };
  } catch {
    return FALLBACK_CONTENT;
  }
});
