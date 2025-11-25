import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FiCpu, FiHeart, FiWifi, 
  FiRefreshCw, FiTool, FiUsers,
  FiShield, FiZap, FiActivity
} from 'react-icons/fi';
import { BsLightningCharge } from 'react-icons/bs';

const features = [
  {
    icon: <FiCpu className="w-8 h-8" />,
    title: "AI Fault Diagnostics",
    description: "Intelligent troubleshooting with 20+ years of expertise. Get solutions from similar issues across your fleet.",
    highlight: true,
    badge: "AI-POWERED"
  },
  {
    icon: <FiHeart className="w-8 h-8" />,
    title: "24/7 Mental Health Support",
    description: "Private AI counselor for offshore workers. Confidential support for isolation, stress, and family issues.",
    highlight: true,
    badge: "INDUSTRY FIRST"
  },
  {
    icon: <FiRefreshCw className="w-8 h-8" />,
    title: "Enforced Handover System",
    description: "Revolutionary handover compliance. No leaving vessel without complete fault reports and recommendations.",
    highlight: true,
    badge: "GAME CHANGER"
  },
  {
    icon: <FiActivity className="w-8 h-8" />,
    title: "Quality Score Gamification",
    description: "Real-time feedback makes quality data entry addictive. Visual scoring eliminates 'garbage in, garbage out'."
  },
  {
    icon: <FiZap className="w-8 h-8" />,
    title: "Predictive Maintenance Learning",
    description: "AI analyzes patterns from your fleet and similar vessels to identify potential issues and optimize schedules."
  },
  {
    icon: <FiWifi className="w-8 h-8" />,
    title: "True Offline Operation",
    description: "Full functionality for 30+ days at sea. Progressive Web App with automatic sync when reconnected."
  },
  {
    icon: <FiUsers className="w-8 h-8" />,
    title: "Integrated Team Chat",
    description: "Real-time messaging with floating chat widget. Keep crew connected across departments and shifts."
  },
  {
    icon: <FiShield className="w-8 h-8" />,
    title: "Enterprise Security",
    description: "Role-based access, audit logging, and secure authentication. Built for compliance and peace of mind."
  },
  {
    icon: <FiTool className="w-8 h-8" />,
    title: "Complete Customization",
    description: "Your procedures, your workflows, your branding. Tailored dashboards and compliance checklists."
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
            REVOLUTIONARY AI FEATURES
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Industry-first innovations that solve real problems faced by maritime maintenance teams every day.
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
              className={`ai-card group relative ${feature.highlight ? 'border-sms-electricBlue border-2' : ''}`}
            >
              {feature.highlight && feature.badge && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {feature.badge}
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