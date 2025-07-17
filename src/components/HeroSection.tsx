import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { BsLightningCharge } from 'react-icons/bs';

const HeroSection: React.FC = () => {
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowSubtext(true), 1000);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Animated AI Grid Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF10_1px,transparent_1px),linear-gradient(to_bottom,#0096FF10_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      {/* Data Flow Lines */}
      <div className="absolute inset-0">
        <div className="data-line w-full top-1/4"></div>
        <div className="data-line w-full top-1/2"></div>
        <div className="data-line w-full top-3/4"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          {/* Large Logo - Center Stage */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-12"
          >
            <div className="relative inline-block">
              <img 
                src="/sms-logo.png" 
                alt="Smart Maintenance Systems" 
                className="h-48 md:h-64 lg:h-72 w-auto mx-auto"
              />
              <div className="absolute inset-0 blur-3xl bg-sms-neonBlue/20 animate-pulse"></div>
            </div>
          </motion.div>

          {/* Company Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-6xl font-tech font-bold mb-4 text-white"
          >
            SMART MAINTENANCE SYSTEMS
          </motion.h1>

          {/* Tagline with AI emphasis */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl md:text-3xl text-sms-neonBlue mb-8 font-tech"
          >
            The Future of Maintenance Today
          </motion.p>

          {/* Key Features Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6 mb-8"
          >
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <FiCpu className="text-sms-electricBlue" />
              <span>Digital Maintenance</span>
            </div>
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <BsLightningCharge className="text-sms-electricBlue" />
              <span>Smart Scheduling</span>
            </div>
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <FiTrendingUp className="text-sms-electricBlue" />
              <span>Performance Tracking</span>
            </div>
          </motion.div>

          {/* Main Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showSubtext ? 1 : 0, y: showSubtext ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-sms-lightGray max-w-3xl mx-auto mb-12"
          >
            Enterprise-grade maintenance management system for maritime fleets. 
            Transform your vessel operations with digital workflows and real-time collaboration designed for the world's leading shipping companies.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showSubtext ? 1 : 0, y: showSubtext ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#contact"
              className="group relative inline-flex items-center ai-button"
            >
              <FiCpu className="mr-2" />
              <span>Contact Sales</span>
              <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <Link
              to="/demo"
              className="inline-flex items-center px-8 py-3 border-2 border-sms-neonBlue text-sms-neonBlue 
                       font-semibold rounded-lg hover:bg-sms-neonBlue hover:text-sms-deepBlue transition-all duration-300 group"
            >
              <BsLightningCharge className="mr-2" />
              <span>Onboarding Demo</span>
              <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">4</div>
              <div className="text-sm text-sms-mediumGray">Weeks to Deploy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">6</div>
              <div className="text-sm text-sms-mediumGray">Specialized Dashboards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">24/7</div>
              <div className="text-sm text-sms-mediumGray">Offline Support</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-sms-electricBlue/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-sms-electricBlue rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;