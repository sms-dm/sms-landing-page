import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function WelcomeScreen({ onComplete, duration = 3000 }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center"
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-grid-move" 
              style={{
                backgroundImage: `linear-gradient(to right, #00CED1 1px, transparent 1px), 
                                 linear-gradient(to bottom, #00CED1 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Scan Line Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-sms-cyan to-transparent animate-scan-line" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Logo with Glow */}
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-sms-cyan/20 blur-3xl" />
                <img 
                  src="/images/sms-logo.svg" 
                  alt="SMS Logo" 
                  className="relative h-32 w-auto"
                />
              </div>

              {/* Welcome Text */}
              <motion.h1 
                className="text-5xl font-bold text-white mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Welcome to
              </motion.h1>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h2 className="text-6xl font-bold bg-gradient-to-r from-sms-cyan to-sms-blue bg-clip-text text-transparent mb-2">
                  Smart Maintenance Systems
                </h2>
                <p className="text-2xl text-gray-300">Vessel Onboarding Portal</p>
              </motion.div>

              {/* Loading Indicator */}
              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="inline-flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sms-cyan rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-sms-cyan rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-sms-cyan rounded-full animate-pulse delay-150" />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Ocean Waves */}
          <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
            <svg className="absolute bottom-0 w-full h-full animate-wave" viewBox="0 0 1440 320">
              <path fill="#00CED1" fillOpacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,213.3C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}