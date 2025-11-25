import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiLock, FiUser, FiChevronLeft } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try maintenance portal first
      const maintenanceResponse = await axios.post('http://localhost:3005/api/auth/login', credentials);
      
      if (maintenanceResponse.data.token) {
        localStorage.setItem('token', maintenanceResponse.data.token);
        localStorage.setItem('user', JSON.stringify(maintenanceResponse.data.user));
        // Redirect to portal access page instead of directly to dashboards
        window.location.href = '/portals';
        return;
      }
    } catch (maintenanceError) {
      // Try onboarding portal
      try {
        const onboardingResponse = await axios.post('http://localhost:3001/api/auth/login', credentials);
        
        if (onboardingResponse.data.token) {
          localStorage.setItem('token', onboardingResponse.data.token);
          localStorage.setItem('user', JSON.stringify(onboardingResponse.data.user));
          // Redirect to portal access page instead of directly to dashboards
          window.location.href = '/portals';
          return;
        }
      } catch (onboardingError) {
        setError('Invalid credentials. Please check your username and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-sms-deepBlue">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF10_1px,transparent_1px),linear-gradient(to_bottom,#0096FF10_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center text-sms-lightGray hover:text-sms-neonBlue mb-8 transition-colors"
          >
            <FiChevronLeft className="mr-2" />
            Back to Home
          </Link>

          {/* Login Card */}
          <div className="ai-card">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="inline-block mb-4"
              >
                <div className="relative">
                  <img src="/sms-logo.png" alt="SMS" className="h-20 w-20 mx-auto" />
                  <div className="absolute inset-0 blur-2xl bg-sms-neonBlue/20"></div>
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-tech font-bold text-white mb-2">
                AI PORTAL ACCESS
              </h1>
              <p className="text-sms-mediumGray">
                Enter credentials to access SMS intelligent systems
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Username
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sms-mediumGray" />
                  <input
                    type="text"
                    required
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sms-lightGray mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sms-mediumGray" />
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg ${
                  isLoading 
                    ? 'bg-sms-electricBlue/50 text-white cursor-not-allowed' 
                    : 'ai-button'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <BsRobot className="text-xl" />
                    <span>Access AI System</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <a href="#" className="block text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">
                Forgot password?
              </a>
              <Link to="/activation-help" className="block text-sm text-sms-mediumGray hover:text-sms-neonBlue transition-colors">
                Need help with activation code?
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-sms-electricBlue/5 border border-sms-electricBlue/20 rounded-lg">
              <p className="text-sm text-sms-lightGray mb-2 font-semibold">
                Demo Credentials:
              </p>
              <div className="space-y-1 text-xs text-sms-mediumGray font-mono">
                <p>Admin: admin / admin123</p>
                <p>Technician: john_tech / admin123</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-sms-mediumGray/60">
              AI-secured connection • Military-grade encryption • Predictive authentication
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;