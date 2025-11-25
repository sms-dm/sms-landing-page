import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralBackground from './NeuralBackground';

interface WelcomeSequenceProps {
  onComplete: () => void;
}

const WelcomeSequence: React.FC<WelcomeSequenceProps> = ({ onComplete }) => {
  const [showInitializing, setShowInitializing] = useState(false);

  useEffect(() => {
    // Show initializing text after welcome + logo sequence
    const initTimer = setTimeout(() => {
      setShowInitializing(true);
    }, 3500);

    // Complete the whole sequence
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-sms-deepBlue flex items-center justify-center overflow-hidden"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Effects */}
        <div className="neural-bg"></div>
        <NeuralBackground />

        {/* Main Content */}
        <div className="relative z-10 text-center px-6">
          <div className="space-y-8">
            {/* Step 1: "WELCOME TO" appears first */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              <span className="glow-text">WELCOME TO</span>
            </motion.h1>

            {/* Step 2: Logo fades in underneath */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
              className="my-8"
            >
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-90"></div>
                <motion.img
                  src="/sms-logo.png"
                  alt="SMS Logo"
                  className="h-48 md:h-56 lg:h-64 w-auto mx-auto relative z-10"
                  style={{
                    filter: 'drop-shadow(0 0 40px rgba(0, 217, 255, 0.8))',
                  }}
                  animate={{
                    filter: [
                      'drop-shadow(0 0 40px rgba(0, 217, 255, 0.8)) brightness(1)',
                      'drop-shadow(0 0 60px rgba(0, 217, 255, 1)) brightness(1.2)',
                      'drop-shadow(0 0 40px rgba(0, 217, 255, 0.8)) brightness(1)'
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2.5
                  }}
                />
                <div className="absolute inset-0 blur-3xl bg-sms-neonBlue/30 scale-150"></div>
              </div>
            </motion.div>

            {/* Step 3: "The Future of Maintenance Today" fades in with logo */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
              className="text-2xl md:text-3xl text-white font-semibold max-w-2xl mx-auto"
            >
              The Future of Maintenance Today
            </motion.p>

            {/* Step 4: "Initializing..." appears */}
            {showInitializing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8"
              >
                <div className="flex justify-center space-x-2 mb-3">
                  <motion.div
                    className="w-2 h-2 bg-sms-neonBlue rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-sms-neonBlue rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-sms-neonBlue rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                  />
                </div>
                <p className="text-sms-lightGray text-lg">Initializing...</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeSequence;
