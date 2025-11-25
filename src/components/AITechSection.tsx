import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCpu, FiActivity, FiZap } from 'react-icons/fi';
import { BiBrain } from 'react-icons/bi';

const AITechSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const technologies = [
    {
      icon: <BiBrain className="w-12 h-12" />,
      title: "Neural Networks",
      description: "Deep learning models trained on millions of maintenance records"
    },
    {
      icon: <FiCpu className="w-12 h-12" />,
      title: "Pattern Recognition",
      description: "Identifies failure patterns invisible to human analysis"
    },
    {
      icon: <FiZap className="w-12 h-12" />,
      title: "Predictive Models",
      description: "Forecasts maintenance needs based on historical data"
    },
    {
      icon: <FiActivity className="w-12 h-12" />,
      title: "AI Fault Diagnostics Assistance",
      description: "Intelligent analysis helps technicians quickly identify and resolve equipment issues"
    }
  ];

  return (
    <section id="ai-tech" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            AI TECHNOLOGY
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            State-of-the-art artificial intelligence designed specifically for maritime maintenance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual representation */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-96 flex items-center justify-center">
              {/* Central AI Core */}
              <div className="absolute w-32 h-32 bg-sms-neonBlue/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-sms-electricBlue to-sms-neonBlue rounded-full flex items-center justify-center">
                <BiBrain className="w-12 h-12 text-white" />
              </div>
              
              {/* Orbiting elements */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-sms-electricBlue rounded-full"></div>
              </div>
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '15s' }}>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-sms-neonBlue rounded-full"></div>
              </div>
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '20s' }}>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-10 h-10 bg-sms-electricBlue/50 rounded-full"></div>
              </div>
              
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full">
                <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#gradient)" strokeWidth="1" strokeDasharray="5,5" className="animate-spin-slow" style={{ animationDuration: '30s' }} />
                <defs>
                  <linearGradient id="gradient">
                    <stop offset="0%" stopColor="#0096FF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Technology list */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="text-sms-neonBlue flex-shrink-0">
                  {tech.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{tech.title}</h3>
                  <p className="text-sms-mediumGray">{tech.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Real AI Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20"
        >
          <div className="ai-card text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Built with Real Maritime Expertise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="text-sms-neonBlue font-semibold mb-2">Proven AI Foundation</h4>
                <p className="text-sms-mediumGray text-sm">
                  Our AI systems are trained on decades of maritime maintenance data and continuously learn from your fleet's patterns.
                </p>
              </div>
              <div>
                <h4 className="text-sms-neonBlue font-semibold mb-2">Industry-First Innovation</h4>
                <p className="text-sms-mediumGray text-sm">
                  From 24/7 mental health support to enforced handover systems, we're solving problems others ignore.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AITechSection;