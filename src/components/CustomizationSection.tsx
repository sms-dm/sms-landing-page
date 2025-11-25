import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCheck } from 'react-icons/fi';

const customizationOptions = [
  {
    title: "Dashboard Layouts",
    items: [
      "Role-specific views for different team members",
      "Custom KPI widgets and metrics",
      "Branded color schemes and logos",
      "Configurable alert thresholds"
    ]
  },
  {
    title: "Documentation System",
    items: [
      "Company-specific form templates",
      "Custom approval workflows",
      "Branded report generation",
      "Tailored compliance checklists"
    ]
  },
  {
    title: "Operational Workflows",
    items: [
      "Custom maintenance procedures",
      "Company-specific safety protocols",
      "Personalized notification rules",
      "Fleet-specific configurations"
    ]
  }
];

const CustomizationSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <section className="py-20 relative bg-gradient-to-b from-sms-darkBlue to-sms-deepBlue">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sms-electricBlue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sms-neonBlue/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            TAILORED TO YOUR NEEDS
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            We understand every shipping company operates differently. That's why SMS can be 
            customized to match your exact specifications and workflows.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {customizationOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-sms-darkBlue/50 backdrop-blur-sm border border-sms-electricBlue/20 rounded-lg p-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">{option.title}</h3>
              <ul className="space-y-4">
                {option.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <FiCheck className="text-sms-neonBlue mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sms-lightGray">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-r from-sms-electricBlue/20 to-sms-neonBlue/20 backdrop-blur-sm border border-sms-electricBlue/30 rounded-lg p-8 md:p-12 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Your System, Your Way
          </h3>
          <p className="text-lg text-sms-lightGray mb-8 max-w-2xl mx-auto">
            During onboarding, our team works closely with you to configure every aspect 
            of the system to match your company's unique requirements. No two SMS deployments 
            are exactly alike.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="#contact"
              className="inline-block bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-sms-electricBlue/30 transition-all duration-300"
            >
              Discuss Your Custom Requirements
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomizationSection;