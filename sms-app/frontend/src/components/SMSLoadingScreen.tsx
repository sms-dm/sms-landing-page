import React from 'react';

interface SMSLoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const SMSLoadingScreen: React.FC<SMSLoadingScreenProps> = ({ 
  message = 'Loading...', 
  showLogo = true 
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center z-50">
      <div className="text-center">
        {showLogo && (
          <div className="mb-8 animate-pulse">
            <img 
              src="/sms-logo.png" 
              alt="SMS Logo" 
              className="h-24 w-auto mx-auto"
            />
          </div>
        )}
        
        <div className="mb-4">
          <div className="w-16 h-16 border-4 border-sms-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        
        <p className="text-white text-lg font-medium">{message}</p>
        <p className="text-gray-400 text-sm mt-2">Smart Maintenance System</p>
        <p className="text-sms-cyan text-xs mt-1 italic">The Future of Maintenance Today</p>
        
        {/* Animated dots */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-sms-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-sms-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-sms-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SMSLoadingScreen;