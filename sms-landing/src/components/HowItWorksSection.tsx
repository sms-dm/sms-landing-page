import React from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiKey, FiSettings, FiAnchor } from 'react-icons/fi';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <FiPhone />,
      title: 'Contact our sales team',
      description: 'Schedule a demo to see how SMS can transform your fleet operations with digital maintenance management.'
    },
    {
      icon: <FiKey />,
      title: 'Receive your activation code',
      description: 'After contract signing, receive your unique enterprise activation code to access the platform.'
    },
    {
      icon: <FiSettings />,
      title: 'Set up your company',
      description: 'Configure your fleet, departments, and team members with our guided onboarding process.'
    },
    {
      icon: <FiAnchor />,
      title: 'Start managing your fleet',
      description: 'Begin optimizing maintenance with digital tracking, smart scheduling, and real-time team collaboration.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Get started with enterprise-grade maintenance management in four simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-[2px] bg-gradient-to-r from-sms-electricBlue to-transparent">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-sms-electricBlue rounded-full"></div>
                </div>
              )}
              
              <div className="ai-card h-full">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-sms-electricBlue rounded-full flex items-center justify-center font-bold text-sms-deepBlue">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="text-4xl text-sms-neonBlue mb-4 flex justify-center">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sms-lightGray">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <a
            href="#contact"
            className="ai-button inline-flex items-center"
          >
            Get Started Today
          </a>
        </motion.div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-sms-electricBlue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sms-neonBlue/5 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default HowItWorksSection;