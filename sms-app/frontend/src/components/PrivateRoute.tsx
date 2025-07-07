import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/geoquip" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects: Record<string, string> = {
      technician: '/dashboard/technician',
      manager: '/dashboard/manager',
      admin: '/dashboard/internal',
      mechanic: '/dashboard/mechanic',
      hse: '/dashboard/hse',
      electrical_manager: '/dashboard/electrical-manager',
      mechanical_manager: '/dashboard/mechanical-manager',
      hse_manager: '/dashboard/hse-manager',
    };
    
    return <Navigate to={roleRedirects[user.role] || '/vessels'} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;