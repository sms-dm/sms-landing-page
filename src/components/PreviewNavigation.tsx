import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';

const PreviewNavigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sms-preview-auth');
    window.location.href = '/';
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'AI Technology', href: '#ai-tech' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-sms-deepBlue/90 backdrop-blur-md border-b border-sms-electricBlue/20' : ''
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/preview" className="flex items-center space-x-3">
            <img src="/sms-logo.png" alt="SMS" className="h-12 w-12" />
            <div>
              <span className="font-tech text-xl font-bold text-sms-neonBlue glow-text">SMS</span>
              <p className="text-xs text-sms-mediumGray">Preview Mode</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sms-lightGray hover:text-sms-neonBlue transition-colors duration-200 font-medium"
              >
                {link.name}
              </a>
            ))}
            <a href="/demo/index.html" className="ai-button">
              Onboarding Demo
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Exit Preview"
            >
              <FiLogOut size={18} />
              <span className="text-sm">Exit Preview</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-sms-neonBlue p-2"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sms-lightGray hover:text-sms-neonBlue transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
            <a
              href="/demo/index.html"
              className="ai-button inline-block mt-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Onboarding Demo
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors mt-4"
            >
              <FiLogOut size={18} />
              <span className="text-sm">Exit Preview</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default PreviewNavigation;