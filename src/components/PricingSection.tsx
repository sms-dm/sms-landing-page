import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCheck, FiX } from 'react-icons/fi';

const pricingPlans = [
  {
    name: 'STARTER',
    price: '$2,500',
    period: 'per vessel/month',
    description: 'Essential AI maintenance management',
    features: [
      { text: 'AI-powered fault prediction', included: true },
      { text: 'Up to 100 equipment items', included: true },
      { text: 'Basic analytics dashboard', included: true },
      { text: '5 user accounts', included: true },
      { text: 'Email support', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Advanced AI models', included: false },
      { text: 'API access', included: false },
      { text: 'Custom integrations', included: false }
    ],
    recommended: false
  },
  {
    name: 'PROFESSIONAL',
    price: '$4,500',
    period: 'per vessel/month',
    description: 'Complete AI maintenance suite',
    features: [
      { text: 'Advanced AI predictions', included: true },
      { text: 'Unlimited equipment items', included: true },
      { text: 'Real-time analytics', included: true },
      { text: '25 user accounts', included: true },
      { text: 'Priority 24/7 support', included: true },
      { text: 'Mobile & offline sync', included: true },
      { text: 'Custom AI models', included: true },
      { text: 'Full API access', included: true },
      { text: 'Fleet-wide insights', included: true }
    ],
    recommended: true
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    period: 'tailored pricing',
    description: 'AI-powered fleet management',
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'Unlimited users & vessels', included: true },
      { text: 'Dedicated AI training', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated success manager', included: true },
      { text: 'On-site deployment', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'White-label options', included: true },
      { text: 'Priority development', included: true }
    ],
    recommended: false
  }
];

const PricingSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <section id="pricing" className="py-20 relative bg-sms-darkBlue/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            TRANSPARENT PRICING
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Simple, straightforward pricing with no hidden fees. Scale as you grow.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative ${plan.recommended ? 'lg:-mt-8' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white px-4 py-1 text-sm font-bold rounded">
                  MOST POPULAR
                </div>
              )}
              
              <div className={`ai-card h-full ${plan.recommended ? 'border-sms-neonBlue' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold mb-2 text-white">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-sms-neonBlue mb-2">
                    {plan.price}
                  </div>
                  <p className="text-sm text-sms-mediumGray">{plan.period}</p>
                  <p className="text-sm text-sms-lightGray mt-2">{plan.description}</p>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center">
                      {feature.included ? (
                        <FiCheck className="w-5 h-5 text-sms-neonBlue mr-3 flex-shrink-0" />
                      ) : (
                        <FiX className="w-5 h-5 text-sms-mediumGray/30 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-sms-lightGray' : 'text-sms-mediumGray/50'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button className={`w-full mt-8 ${plan.recommended ? 'ai-button' : 'px-8 py-3 border-2 border-sms-electricBlue text-sms-electricBlue font-semibold rounded-lg hover:bg-sms-electricBlue/10 transition-all duration-300'}`}>
                  Get Started
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sms-mediumGray text-sm max-w-2xl mx-auto">
            All plans include core features, regular updates, and access to our global support network. 
            Volume discounts available for fleets of 5+ vessels.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;