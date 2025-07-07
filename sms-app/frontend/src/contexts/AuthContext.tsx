import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'technician' | 'manager' | 'admin' | 'mechanic' | 'hse' | 'electrical_manager' | 'mechanical_manager' | 'hse_manager';
  department?: string;
  default_vessel_id?: number;
  avatarUrl?: string;
  company: {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  dashboardUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('sms_access_token');
      const refreshToken = localStorage.getItem('sms_refresh_token');
      
      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Try to refresh the token if access token is expired
      if (error.response?.status === 401) {
        await refreshToken();
      } else {
        localStorage.removeItem('sms_access_token');
        localStorage.removeItem('sms_refresh_token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('sms_access_token', accessToken);
      localStorage.setItem('sms_refresh_token', refreshToken);
      setUser(user);
      
      toast.success(`Welcome back, ${user.firstName}!`);
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('sms_refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('sms_access_token');
      localStorage.removeItem('sms_refresh_token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('sms_refresh_token');
      if (!refreshToken) return;

      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('sms_access_token', accessToken);
      localStorage.setItem('sms_refresh_token', newRefreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      logout();
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};