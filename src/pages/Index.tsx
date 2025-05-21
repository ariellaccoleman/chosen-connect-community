import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import StatsSection from '@/components/home/StatsSection';
import MissionSection from '@/components/home/MissionSection';
import CallToAction from '@/components/home/CallToAction';
import FeaturedHubs from "@/components/hubs/FeaturedHubs";

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <FeaturedHubs />
      <StatsSection />
      <MissionSection />
      <CallToAction />
    </>
  );
};

export default Index;
