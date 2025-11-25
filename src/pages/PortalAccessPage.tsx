import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import PortalSwitcher from '../components/PortalSwitcher';
import { motion } from 'framer-motion';

const PortalAccessPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-deepBlue">
        <div className="w-8 h-8 border-2 border-sms-neonBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-sms-deepBlue relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF10_1px,transparent_1px),linear-gradient(to_bottom,#0096FF10_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <img src="/sms-logo.png" alt="SMS" className="h-20 w-20 mx-auto" />
              <div className="absolute inset-0 blur-2xl bg-sms-neonBlue/20"></div>
            </div>
            <h1 className="text-3xl font-tech font-bold text-white mb-2">
              SMART MAINTENANCE SYSTEMS
            </h1>
          </div>

          {/* Portal Switcher */}
          <PortalSwitcher />
          
          {/* User Info */}
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('sms-preview-auth');
                window.location.href = '/';
              }}
              className="text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalAccessPage;