import AboutBirdSection from "@/components/marketing/home/AboutBirdSection";
import ContactSection from "@/components/marketing/home/ContactSection";
import FaqSection from "@/components/marketing/home/FaqSection";
import ForProvidersSection from "@/components/marketing/home/ForProvidersSection";
import HomeFooter from "@/components/marketing/home/HomeFooter";
import HomeHeader from "@/components/marketing/home/HomeHeader";
import ImageBanner from "@/components/marketing/home/ImageBanner";
import OurPartnersSection from "@/components/marketing/home/OurPartnersSection";
import SponsorLogos from "@/components/marketing/home/SponsorLogos";
import TestimonialsSection from "@/components/marketing/home/TestimonialsSection";
import WhyBirdMattersSection from "@/components/marketing/home/WhyBirdMattersSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main>
        <AboutBirdSection />
        <WhyBirdMattersSection />
        <ImageBanner />
        <OurPartnersSection />
        <SponsorLogos />
        {/* <TestimonialsSection /> */}
        <ForProvidersSection />
        <FaqSection />
        <ContactSection />
      </main>

      <HomeFooter />
    </div>
  );
}
