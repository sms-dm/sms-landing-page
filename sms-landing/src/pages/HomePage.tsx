import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import PreviewNavigation from '../components/PreviewNavigation';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CustomizationSection from '../components/CustomizationSection';
import AITechSection from '../components/AITechSection';
import HowItWorksSection from '../components/HowItWorksSection';
import StatsSection from '../components/StatsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const location = useLocation();
  const isPreview = location.pathname === '/preview';

  return (
    <div className="relative z-10">
      {isPreview ? <PreviewNavigation /> : <Navigation />}
      <HeroSection />
      <FeaturesSection />
      <CustomizationSection />
      <AITechSection />
      <HowItWorksSection />
      <StatsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage;