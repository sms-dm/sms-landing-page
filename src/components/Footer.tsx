import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-sms-electricBlue/10 relative bg-sms-deepBlue/50">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <p className="text-sm text-sms-mediumGray">
            © {currentYear} Smart Maintenance Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;