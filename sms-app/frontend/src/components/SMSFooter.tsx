import React from 'react';

interface SMSFooterProps {
  className?: string;
  variant?: 'full' | 'minimal';
}

const SMSFooter: React.FC<SMSFooterProps> = ({ className = '', variant = 'minimal' }) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <div className={`text-center py-4 text-xs text-gray-500 ${className}`}>
        <p>Powered by SMS • © {currentYear} Smart Maintenance System</p>
      </div>
    );
  }

  return (
    <footer className={`bg-sms-dark border-t border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <img 
              src="/sms-logo.png" 
              alt="SMS Logo" 
              className="h-8 w-auto"
            />
            <div>
              <p className="text-white font-semibold">Smart Maintenance System</p>
              <p className="text-sms-cyan text-sm italic">The Future of Maintenance Today</p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm">© {currentYear} SMS. All rights reserved.</p>
            <p className="text-gray-500 text-xs mt-1">Version 2.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SMSFooter;