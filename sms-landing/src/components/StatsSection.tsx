import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const AnimatedStat: React.FC<StatProps> = ({ value, suffix, label, prefix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5
  });

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-6xl font-tech font-bold text-sms-neonBlue glow-text">
        {prefix}{count}{suffix}
      </div>
      <p className="text-lg text-sms-lightGray mt-2">{label}</p>
    </div>
  );
};

const StatsSection: React.FC = () => {
  const stats = [
    { value: 100, suffix: '%', label: 'Digital Records', prefix: '' },
    { value: 6, suffix: '', label: 'Specialized Roles', prefix: '' },
    { value: 4, suffix: ' Weeks', label: 'Fast Deployment', prefix: '' },
    { value: 24, suffix: '/7', label: 'Offline Access', prefix: '' }
  ];

  return (
    <section id="stats" className="py-20 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF05_1px,transparent_1px),linear-gradient(to_bottom,#0096FF05_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            WHY CHOOSE SMS
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Built by maritime professionals for maritime professionals. Real solutions for real challenges.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <AnimatedStat {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="ai-card text-center">
            <h3 className="text-2xl font-tech font-bold mb-6 text-white">
              BUILT FOR THE MARITIME INDUSTRY
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-sms-neonBlue mb-2">20+</div>
                <p className="text-sms-mediumGray">Years Maritime Experience</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-sms-neonBlue mb-2">25</div>
                <p className="text-sms-mediumGray">Target Vessels Year 1</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-sms-neonBlue mb-2">Zero</div>
                <p className="text-sms-mediumGray">Paper Required</p>
              </div>
            </div>

            <p className="mt-8 text-sms-lightGray max-w-2xl mx-auto">
              "Finally, a maintenance system that understands how ships actually work. 
              The team communication features alone have transformed our operations."
            </p>
            <p className="mt-4 text-sm text-sms-mediumGray">
              - Chief Engineer, International Shipping Company
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;