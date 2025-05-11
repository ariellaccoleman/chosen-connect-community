
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import FeaturesSection from "@/components/FeaturesSection";
import MissionSection from "@/components/MissionSection";
import StatsSection from "@/components/StatsSection";
import CallToAction from "@/components/CallToAction";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <StatsSection />
      <MissionSection />
      <CallToAction />
    </Layout>
  );
};

export default Index;
