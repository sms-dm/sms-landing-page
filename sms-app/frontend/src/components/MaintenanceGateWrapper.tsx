import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import MaintenanceStatusGate from './MaintenanceStatusGate';

interface MaintenanceGateWrapperProps {
  children: React.ReactNode;
}

const MaintenanceGateWrapper: React.FC<MaintenanceGateWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsStatusEntry, setNeedsStatusEntry] = useState(false);

  useEffect(() => {
    checkMaintenanceStatus();
  }, [user]);

  const checkMaintenanceStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Only check for technician role (and potentially mechanic)
    if (!['technician', 'mechanic'].includes(user.role)) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/user/maintenance-status-complete');
      setNeedsStatusEntry(!response.data.isComplete && response.data.isFirstLogin);
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      // In case of error, allow normal access
      setNeedsStatusEntry(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sms-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsStatusEntry) {
    return <MaintenanceStatusGate />;
  }

  return <>{children}</>;
};

export default MaintenanceGateWrapper;