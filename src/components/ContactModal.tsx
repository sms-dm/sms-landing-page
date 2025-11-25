import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiUser, FiMessageSquare, FiCheck, FiPhone } from 'react-icons/fi';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: '08f32194-e9d2-4681-90de-8e92fbd72ee8',
          subject: 'New Contact Inquiry - SMS Landing Page',
          from_name: formData.name,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          message: '',
        });
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 3000);
      } else {
        setError(result.message || 'Something went wrong. Please try again or email us directly.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1a2744] border-2 border-[#00d9ff]/30 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success State */}
              {isSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <FiCheck className="text-green-500 text-4xl" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400 mb-4">
                    We'll get back to you within 24 hours.
                  </p>
                  <p className="text-sm text-gray-500">This window will close automatically...</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[#00d9ff]/20">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Contact Us</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        We're here to help with any questions
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors p-2"
                    >
                      <FiX className="text-2xl" />
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Direct Contact Options */}
                    <div className="mb-6 bg-[#0a1929] border border-[#00d9ff]/20 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <FiMail className="text-[#00d9ff]" />
                        Get in Touch Directly
                      </h3>

                      <div className="space-y-3">
                        {/* Email */}
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Email:</p>
                          <a
                            href="mailto:info@smsystems.uk"
                            className="text-[#00d9ff] hover:text-[#00d9ff]/80 transition-colors font-medium text-sm flex items-center gap-2"
                          >
                            <FiMail className="text-sm" />
                            info@smsystems.uk
                          </a>
                        </div>

                        {/* Phone */}
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Phone:</p>
                          <a
                            href="tel:+447515811931"
                            className="text-[#00d9ff] hover:text-[#00d9ff]/80 transition-colors font-medium text-sm flex items-center gap-2"
                          >
                            <FiPhone className="text-sm" />
                            +44 (0) 7515 811 931
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#00d9ff]/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#1a2744] text-gray-400">Or send us a message</span>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Name *
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-[#0a1929] border border-[#00d9ff]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent"
                            placeholder="Your name"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-[#0a1929] border border-[#00d9ff]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Message *
                        </label>
                        <div className="relative">
                          <FiMessageSquare className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full pl-10 pr-4 py-3 bg-[#0a1929] border border-[#00d9ff]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent resize-none"
                            placeholder="How can we help you?"
                          />
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 px-4 bg-gradient-to-r from-[#0066cc] to-[#00d9ff] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00d9ff]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending...</span>
                            </div>
                          ) : (
                            'Send Message'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-3 px-4 bg-transparent border-2 border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800 hover:border-gray-500 transition-all"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        We typically respond within 24 hours
                      </p>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
