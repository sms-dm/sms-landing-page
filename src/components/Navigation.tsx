import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

interface NavigationProps {
  onContactClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onContactClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Customisation', href: '#customization' },
    { name: 'Why SMS', href: '#why-sms' },
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
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img
                src="/sms-logo.png"
                alt="SMS"
                className="h-16 w-16"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.6))' }}
              />
            </Link>
            <div className="hidden md:flex items-center gap-3 border-l border-sms-electricBlue/30 pl-6">
              <span className="text-xs text-sms-mediumGray">Supported by</span>
              <img
                src="/innovate-uk-logo.png"
                alt="Innovate UK"
                className="h-8"
              />
            </div>
          </div>

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
            <button
              onClick={onContactClick}
              className="px-6 py-2 bg-gradient-to-r from-[#0066cc] to-[#00d9ff] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00d9ff]/50 transition-all"
            >
              Contact Us
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
            className="md:hidden mt-4 bg-sms-deepBlue/95 backdrop-blur-md rounded-lg p-4 border border-sms-electricBlue/20"
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
            <button
              onClick={() => {
                onContactClick?.();
                setIsMobileMenuOpen(false);
              }}
              className="mt-3 w-full px-6 py-2 bg-gradient-to-r from-[#0066cc] to-[#00d9ff] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00d9ff]/50 transition-all"
            >
              Contact Us
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navigation;