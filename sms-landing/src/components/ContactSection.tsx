import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiMail, FiPhone, FiMapPin, FiGlobe, FiSend } from 'react-icons/fi';

const ContactSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    vessels: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage('Message received. Our AI will route this to the right team member.');
      setFormData({
        name: '',
        email: '',
        company: '',
        vessels: '',
        message: ''
      });
      
      setTimeout(() => setSubmitMessage(''), 5000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: <FiMail />,
      label: 'Email',
      value: 'contact@smartmaintenancesystems.com',
      link: 'mailto:contact@smartmaintenancesystems.com'
    },
    {
      icon: <FiPhone />,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    },
    {
      icon: <FiMapPin />,
      label: 'Headquarters',
      value: 'Houston, TX, USA',
      link: '#'
    },
    {
      icon: <FiGlobe />,
      label: 'Global Support',
      value: '24/7 Available',
      link: '#'
    }
  ];

  return (
    <section id="contact" className="py-20 relative bg-sms-darkBlue/50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF05_1px,transparent_1px),linear-gradient(to_bottom,#0096FF05_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-tech font-bold mb-4 text-white">
            START YOUR AI JOURNEY
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue mx-auto mb-8"></div>
          <p className="text-xl text-sms-lightGray max-w-3xl mx-auto">
            Ready to transform your maintenance operations? Let's discuss how AI can revolutionize your fleet.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                  placeholder="Shipping Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Number of Vessels
                </label>
                <input
                  type="text"
                  value={formData.vessels}
                  onChange={(e) => setFormData({ ...formData, vessels: e.target.value })}
                  className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                  placeholder="e.g., 5-10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors resize-none rounded-lg"
                  placeholder="Tell us about your maintenance challenges..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg ${
                  isSubmitting 
                    ? 'bg-sms-electricBlue/50 text-white cursor-not-allowed' 
                    : 'ai-button'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <FiSend />
                  </>
                )}
              </button>

              {submitMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sms-neonBlue text-center"
                >
                  {submitMessage}
                </motion.p>
              )}
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-tech font-bold mb-6 text-white">
                CONNECT WITH US
              </h3>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.link}
                    className="flex items-start space-x-4 group"
                  >
                    <div className="text-sms-neonBlue text-xl group-hover:animate-pulse">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-sm text-sms-mediumGray">{info.label}</p>
                      <p className="text-lg text-white group-hover:text-sms-neonBlue transition-colors">
                        {info.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="ai-card">
              <h4 className="text-xl font-semibold mb-4 text-white">
                Why Choose SMS?
              </h4>
              <ul className="space-y-3 text-sms-lightGray">
                <li className="flex items-start">
                  <span className="text-sms-neonBlue mr-2">▸</span>
                  AI-powered predictive maintenance
                </li>
                <li className="flex items-start">
                  <span className="text-sms-neonBlue mr-2">▸</span>
                  20+ years offshore expertise
                </li>
                <li className="flex items-start">
                  <span className="text-sms-neonBlue mr-2">▸</span>
                  4-week deployment guarantee
                </li>
                <li className="flex items-start">
                  <span className="text-sms-neonBlue mr-2">▸</span>
                  24/7 global support network
                </li>
              </ul>
            </div>

            <div className="p-6 border-2 border-sms-electricBlue/30 rounded-lg bg-sms-electricBlue/5">
              <p className="text-white font-semibold mb-2">
                See AI in Action
              </p>
              <p className="text-sms-lightGray text-sm">
                Schedule a personalized demo and discover how our AI technology can transform your fleet operations.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;