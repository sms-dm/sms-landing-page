import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-sms-electricBlue/20 relative bg-sms-deepBlue">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img src="/sms-logo.png" alt="SMS" className="h-10 w-10" />
              <div>
                <span className="font-tech text-lg font-bold text-sms-neonBlue">SMS</span>
                <p className="text-xs text-sms-mediumGray">The Future of Maintenance Today</p>
              </div>
            </Link>
            <p className="text-sm text-sms-mediumGray">
              AI-powered predictive maintenance for the maritime industry.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Features</a></li>
              <li><a href="#ai-tech" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">AI Technology</a></li>
              <li><a href="#pricing" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Pricing</a></li>
              <li><Link to="/login" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-sms-mediumGray hover:text-sms-neonBlue transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-sms-mediumGray hover:text-sms-neonBlue transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-sms-mediumGray hover:text-sms-neonBlue transition-colors">
                <FiGithub className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-sms-electricBlue/10 text-center">
          <p className="text-sm text-sms-mediumGray">
            © {currentYear} Smart Maintenance Systems. All rights reserved.
          </p>
          <p className="text-xs text-sms-mediumGray/60 mt-2">
            Powered by artificial intelligence. Built for maritime excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;