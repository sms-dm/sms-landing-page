import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { companyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

interface DemoAccount {
  email: string;
  role: string;
  name: string;
}

const CompanyLogin: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>();

  // Demo accounts
  const demoAccounts: DemoAccount[] = [
    { email: 'john.doe@oceanic.com', role: 'Electrician', name: 'John Doe' },
    { email: 'mike.chen@oceanic.com', role: 'Mechanic', name: 'Mike Chen' },
    { email: 'sarah.williams@oceanic.com', role: 'HSE Officer', name: 'Sarah Williams' },
    { email: 'lisa.anderson@oceanic.com', role: 'HSE Manager', name: 'Lisa Anderson' },
    { email: 'tom.rodriguez@oceanic.com', role: 'Electrical Manager', name: 'Tom Rodriguez' },
    { email: 'james.wilson@oceanic.com', role: 'Mechanical Manager', name: 'James Wilson' },
    { email: 'admin@smsportal.com', role: 'SMS Portal Admin', name: 'Admin User' },
  ];

  // Fetch company branding
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companySlug],
    queryFn: () => companyAPI.getBySlug(companySlug!),
    select: (response) => response.data,
    enabled: !!companySlug,
  });

  // Handle demo account selection
  const handleDemoSelect = (email: string) => {
    if (email) {
      const account = demoAccounts.find(acc => acc.email === email);
      if (account) {
        setValue('email', account.email);
        setValue('password', 'demo123');
        setSelectedDemo(email);
      }
    } else {
      setValue('email', '');
      setValue('password', '');
      setSelectedDemo('');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if already on a vessel rotation
      const rotation = localStorage.getItem('sms_rotation');
      const selectedVessel = localStorage.getItem('sms_selected_vessel');
      
      if (rotation && selectedVessel) {
        const rotationData = JSON.parse(rotation);
        const endDate = new Date(rotationData.endDate);
        const now = new Date();
        
        // If rotation hasn't ended, go straight to dashboard
        if (endDate > now) {
          // Use the dashboard URL from the user object if available
          if ((user as any).dashboardUrl) {
            navigate((user as any).dashboardUrl);
          } else {
            // Fallback to role-based routing
            const roleRoutes: Record<string, string> = {
              technician: '/dashboard/technician',
              manager: '/dashboard/manager',
              admin: '/dashboard/internal',
              mechanic: '/dashboard/mechanic',
              hse: '/dashboard/hse',
              electrical_manager: '/dashboard/electrical-manager',
              mechanical_manager: '/dashboard/mechanical-manager',
              hse_manager: '/dashboard/hse-manager',
            };
            navigate(roleRoutes[user.role]);
          }
          return;
        }
      }
      
      navigate('/vessels');
    }
  }, [isAuthenticated, navigate, user]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      // Navigation will be handled by useEffect after user state updates
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-dark">
        <div className="w-16 h-16 border-4 border-sms-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-dark">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Company not found</h1>
          <p className="text-gray-400">Please check your login URL</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sms-dark to-sms-gray p-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, ${company.primaryColor}22 0%, transparent 50%)`,
      }}
    >
      {/* Animated ocean waves */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
        <div className="ocean-bg"></div>
      </div>
      
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sms-cyan/20 to-blue-500/20 rounded-2xl blur-xl"></div>
          
          {/* Main card with glassmorphism */}
          <div className="relative bg-sms-gray/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 animate-fade-in border border-white/10">
          {/* Company Logo */}
          <div className="text-center mb-8">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name}
                className="h-20 mx-auto mb-4"
              />
            ) : (
              <h1 className="text-3xl font-bold text-white mb-4">{company.name}</h1>
            )}
            <h2 className="text-xl text-gray-300">Smart Maintenance System</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Demo Account Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Demo Account
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedDemo}
                  onChange={(e) => handleDemoSelect(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan focus:ring-1 focus:ring-sms-cyan transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Choose a demo account...</option>
                  {demoAccounts.map((account) => (
                    <option key={account.email} value={account.email}>
                      {account.name} - {account.role}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedDemo && (
                <p className="mt-1 text-xs text-sms-cyan">
                  {demoAccounts.find(acc => acc.email === selectedDemo)?.role}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan focus:ring-1 focus:ring-sms-cyan transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  type="password"
                  className="w-full pl-10 pr-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan focus:ring-1 focus:ring-sms-cyan transition-colors"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end mb-4">
              <a
                href="/forgot-password"
                className="text-sm text-gray-400 hover:text-sms-cyan transition-colors"
              >
                Forgot your password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg relative overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${company.primaryColor}, ${company.primaryColor}dd)`,
                boxShadow: '0 4px 15px 0 rgba(0, 206, 209, 0.2)',
              }}
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700"></div>
              <span className="relative z-10">
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-sms-dark/50 rounded-lg">
            <p className="text-sm text-gray-400 text-center">
              Select a demo account from the dropdown above to auto-fill credentials
            </p>
          </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img 
              src="/sms-logo.png" 
              alt="SMS" 
              className="h-6 w-auto opacity-70"
            />
            <p className="text-gray-500 text-sm">
              Powered by Smart Maintenance System
            </p>
            <p className="text-sms-cyan text-xs italic">
              The Future of Maintenance Today
            </p>
          </div>
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} SMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;