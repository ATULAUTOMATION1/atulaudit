import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ReportPreview } from "@/components/landing/report-preview";
import { MoreThanSeo } from "@/components/landing/more-than-seo";
import { FeatureSections } from "@/components/landing/feature-sections";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FinalCta } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ReportPreview />
        <MoreThanSeo />
        <FeatureSections />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
