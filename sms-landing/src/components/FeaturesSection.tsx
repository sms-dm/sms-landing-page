import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FiShield, FiUsers, FiGlobe, 
  FiSmartphone, FiClock, FiLock,
  FiBarChart, FiWifi, FiSettings
} from 'react-icons/fi';
import { BsLightningCharge } from 'react-icons/bs';
import { MdDashboardCustomize } from 'react-icons/md';

const features = [
  {
    icon: <MdDashboardCustomize className="w-8 h-8" />,
    title: "Custom Dashboards",
    description: "Dashboards tailored to your specific operational needs, showing exactly what matters to your team.",
    highlight: true
  },
  {
    icon: <FiSettings className="w-8 h-8" />,
    title: "Bespoke Documentation",
    description: "Documentation system customized to match your company's procedures and compliance requirements.",
    highlight: true
  },
  {
    icon: <FiShield className="w-8 h-8" />,
    title: "Equipment Management",
    description: "Comprehensive tracking of all vessel equipment with detailed maintenance history and specifications."
  },
  {
    icon: <FiClock className="w-8 h-8" />,
    title: "Maintenance Scheduling",
    description: "Smart scheduling system that tracks planned maintenance, running hours, and certification deadlines."
  },
  {
    icon: <FiUsers className="w-8 h-8" />,
    title: "Team Communication",
    description: "Built-in messaging system for seamless coordination between crew members and departments."
  },
  {
    icon: <BsLightningCharge className="w-8 h-8" />,
    title: "Fast Deployment",
    description: "Streamlined onboarding process gets your vessel operational in under 4 weeks."
  },
  {
    icon: <FiBarChart className="w-8 h-8" />,
    title: "Parts Ordering",
    description: "Integrated parts management with direct ordering and inventory tracking capabilities."
  },
  {
    icon: <FiWifi className="w-8 h-8" />,
    title: "Offline-First Design",
    description: "Full functionality at sea with automatic synchronization when reconnected."
  },
  {
    icon: <FiGlobe className="w-8 h-8" />,
    title: "Multi-Vessel Support",
    description: "Manage your entire fleet from a single dashboard with role-based access control."
  }
];

const FeaturesSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="features" className="py-20 relative bg-sms-darkBlue/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            POWERFUL FEATURES
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Everything you need to manage maintenance efficiently and keep your vessels running smoothly.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`ai-card group ${feature.highlight ? 'border-sms-electricBlue border-2' : ''}`}
            >
              {feature.highlight && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white text-xs px-3 py-1 rounded-full font-semibold">
                  CUSTOMIZABLE
                </div>
              )}
              <div className="text-sms-neonBlue mb-4 group-hover:animate-pulse">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-sms-mediumGray text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;