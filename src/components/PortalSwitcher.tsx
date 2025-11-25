import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiClipboard, FiCheck, FiArrowRight, FiLock } from 'react-icons/fi';
import { BsGear } from 'react-icons/bs';
import axios from 'axios';

interface PortalStatus {
  onboardingComplete: boolean;
  hasMaintenanceAccess: boolean;
  vesselName?: string;
  onboardingStatus?: string;
}

const PortalSwitcher: React.FC = () => {
  const [portalStatus, setPortalStatus] = useState<PortalStatus>({
    onboardingComplete: false,
    hasMaintenanceAccess: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPortalStatus();
  }, []);

  const checkPortalStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (token && user.id) {
        // Check onboarding status
        try {
          const response = await axios.get('http://localhost:3001/api/vessels/status', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const vessels = response.data;
          const completedVessel = vessels.find((v: any) => 
            v.onboardingStatus === 'APPROVED' || v.onboardingStatus === 'EXPORTED'
          );
          
          setPortalStatus({
            onboardingComplete: !!completedVessel,
            hasMaintenanceAccess: !!completedVessel,
            vesselName: completedVessel?.name,
            onboardingStatus: completedVessel?.onboardingStatus
          });
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortalAccess = (portal: 'onboarding' | 'maintenance') => {
    const token = localStorage.getItem('token');
    
    if (portal === 'onboarding') {
      window.location.href = 'http://localhost:3001/dashboard';
    } else if (portal === 'maintenance') {
      if (portalStatus.hasMaintenanceAccess) {
        window.location.href = 'http://localhost:3000/dashboard';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-sms-neonBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-tech font-bold text-white mb-2">
          Portal Access
        </h2>
        <p className="text-sms-mediumGray">
          Select your destination portal
        </p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {/* Onboarding Portal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => handlePortalAccess('onboarding')}
            className="w-full ai-card hover:border-sms-neonBlue/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FiClipboard className="text-3xl text-sms-electricBlue" />
                  {portalStatus.onboardingComplete && (
                    <FiCheck className="absolute -top-1 -right-1 text-green-400 text-sm bg-sms-deepBlue rounded-full p-1" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    Onboarding Portal
                  </h3>
                  <p className="text-sm text-sms-mediumGray">
                    {portalStatus.onboardingComplete 
                      ? `Status: ${portalStatus.onboardingStatus} - ${portalStatus.vesselName}`
                      : 'Set up vessel equipment and documentation'
                    }
                  </p>
                </div>
              </div>
              <FiArrowRight className="text-xl text-sms-mediumGray group-hover:text-sms-neonBlue transition-colors" />
            </div>
          </button>
        </motion.div>

        {/* Maintenance Portal */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            onClick={() => handlePortalAccess('maintenance')}
            disabled={!portalStatus.hasMaintenanceAccess}
            className={`w-full ai-card transition-all duration-300 group ${
              portalStatus.hasMaintenanceAccess 
                ? 'hover:border-sms-neonBlue/50 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FiSettings className="text-3xl text-sms-electricBlue" />
                  {!portalStatus.hasMaintenanceAccess && (
                    <FiLock className="absolute -top-1 -right-1 text-sms-mediumGray text-sm bg-sms-deepBlue rounded-full p-1" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    Maintenance Portal
                  </h3>
                  <p className="text-sm text-sms-mediumGray">
                    {portalStatus.hasMaintenanceAccess 
                      ? 'Access AI-powered maintenance system'
                      : 'Complete onboarding to unlock access'
                    }
                  </p>
                </div>
              </div>
              <FiArrowRight className={`text-xl transition-colors ${
                portalStatus.hasMaintenanceAccess 
                  ? 'text-sms-mediumGray group-hover:text-sms-neonBlue' 
                  : 'text-sms-darkGray'
              }`} />
            </div>
          </button>
        </motion.div>
      </div>

      {/* Status Info */}
      {portalStatus.onboardingComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg max-w-2xl mx-auto"
        >
          <div className="flex items-center space-x-2">
            <FiCheck className="text-green-400" />
            <p className="text-sm text-green-400">
              Onboarding complete! Full system access granted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Switch Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-8"
      >
        <p className="text-xs text-sms-mediumGray/60">
          <BsGear className="inline-block mr-1" />
          Single sign-on enabled • Switch between portals seamlessly
        </p>
      </motion.div>
    </div>
  );
};

export default PortalSwitcher;