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
                className="h-48 md:h-64 lg:h-72 w-auto mx-auto relative z-10"
                style={{ 
                  filter: 'brightness(1.1) contrast(1.8) saturate(1.5) drop-shadow(0 0 40px rgba(0, 217, 255, 1.2)) drop-shadow(0 0 80px rgba(0, 217, 255, 1)) drop-shadow(0 0 120px rgba(0, 217, 255, 0.6))',
                }}
              />
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

          {/* Powerful Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl md:text-3xl text-sms-neonBlue mb-8 font-tech"
          >
            AI-Powered Maintenance Intelligence for Modern Fleets
          </motion.p>

          {/* Core Value Props */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6 mb-8"
          >
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <FiCpu className="text-sms-electricBlue" />
              <span>AI That Learns & Predicts</span>
            </div>
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <BsLightningCharge className="text-sms-electricBlue" />
              <span>True Offline Capability</span>
            </div>
            <div className="flex items-center space-x-2 text-sms-mediumGray">
              <FiTrendingUp className="text-sms-electricBlue" />
              <span>Mental Health Support</span>
            </div>
          </motion.div>

          {/* Main Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showSubtext ? 1 : 0, y: showSubtext ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-sms-lightGray max-w-3xl mx-auto mb-12"
          >
            Transform your vessel maintenance with predictive AI, seamless handovers, and true offline operation. 
            Built specifically for offshore life with 24/7 mental health support and revolutionary fault assistance.
          </motion.p>

          {/* CTA Button - Single Focus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showSubtext ? 1 : 0, y: showSubtext ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <a
              href="#contact"
              className="group relative inline-flex items-center ai-button text-xl px-12 py-4"
            >
              <FiCpu className="mr-3 text-xl" />
              <span>Get Your Custom Quote</span>
              <FiChevronRight className="ml-3 text-xl group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Key Differentiators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">30</div>
              <div className="text-sm text-sms-mediumGray">Days Offline Ready</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">24/7</div>
              <div className="text-sm text-sms-mediumGray">AI Mental Health</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sms-neonBlue">100%</div>
              <div className="text-sm text-sms-mediumGray">Handover Compliance</div>
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