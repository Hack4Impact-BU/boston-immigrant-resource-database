import FaqAccordion from "./FaqAccordion";
import { client } from "@/lib/sanity";
import { FOR_PROVIDERS_FAQ } from "./data";

async function getProviderFaqs() {
  try {
    const faqs = await client.fetch<
      { _id: string; trigger: string; content: string }[]
    >(`*[_type == "faqItem" && section == "providers"]{
      _id,
      trigger,
      content
    }`);
    return faqs?.length ? faqs : [...FOR_PROVIDERS_FAQ];
  } catch {
    return [...FOR_PROVIDERS_FAQ];
  }
}

export default async function ForProvidersSection() {
  const faqs = await getProviderFaqs();

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <h2 className="text-center text-2xl font-bold text-bird-accent md:text-3xl">
          For Providers
        </h2>
        <div className="mt-8 rounded-2xl bg-white px-2 md:px-6">
          <FaqAccordion items={faqs} defaultOpen="0" centered />
        </div>
      </div>
    </section>
  );
}
