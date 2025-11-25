import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NeuralBackground from '../components/NeuralBackground';

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGlitch, setShowGlitch] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const auth = localStorage.getItem('sms-preview-auth');
    if (auth === 'true') {
      navigate('/preview');
    }
    
    // Show glitch effect for 2 seconds
    setTimeout(() => setShowGlitch(false), 2000);
  }, [navigate]);

  // Handle secret click pattern (5 clicks on logo)
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      setShowLogin(true);
      setClickCount(0);
    }
    
    // Reset count after 2 seconds
    setTimeout(() => setClickCount(0), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials
    if (credentials.email === 'info@smartmarine.uk' && 
        credentials.password === 'SmartMarine25!') {
      localStorage.setItem('sms-preview-auth', 'true');
      setIsAuthenticated(true);
      // Go directly to preview without warp transition
      setTimeout(() => {
        window.location.href = '/preview';
      }, 500);
    } else {
      setError('Invalid credentials');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden flex items-center justify-center">
      {/* Neural Background */}
      <NeuralBackground />
      
      {/* Glitch overlay */}
      <AnimatePresence>
        {showGlitch && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50"
          >
            <div className="glitch-container">
              <div className="glitch-effect"></div>
              <div className="glitch-effect glitch-2"></div>
              <div className="glitch-effect glitch-3"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 w-full h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center justify-center space-y-8 md:space-y-12">
          {/* Logo with secret click area */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="select-none"
            onClick={handleLogoClick}
          >
            <img 
              src="/smart-maintenance-logo.jpg" 
              alt="SMS Logo" 
              className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 glow-effect"
              draggable={false}
            />
          </motion.div>

          {/* Coming Soon Text */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 3.5, duration: 1 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] sm:tracking-[0.2em] text-gray-400 text-center"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            COMING SOON
          </motion.h1>
        </div>
      </div>

      {/* Hidden Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-sms-blue/30 rounded-lg p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Preview Access</h2>
              
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sms-blue focus:outline-none transition-colors"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sms-blue focus:outline-none transition-colors"
                    required
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mb-4"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sms-blue to-sms-light text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-sms-blue/30 transition-all duration-300"
                >
                  {isAuthenticated ? 'Authenticating...' : 'Access Preview'}
                </button>
              </form>

              <button
                onClick={() => setShowLogin(false)}
                className="mt-4 text-gray-500 hover:text-gray-300 text-sm w-full text-center"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glitch CSS */}
      <style>{`
        .glow-effect {
          filter: drop-shadow(0 0 20px rgba(37, 99, 235, 0.5));
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .glitch-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .glitch-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(37, 99, 235, 0.1) 30%,
            rgba(37, 99, 235, 0.1) 70%,
            transparent 70%
          );
          animation: glitch 0.3s infinite;
        }

        .glitch-2 {
          animation-delay: 0.1s;
          animation-duration: 0.2s;
          background: linear-gradient(
            -45deg,
            transparent 40%,
            rgba(59, 130, 246, 0.1) 40%,
            rgba(59, 130, 246, 0.1) 60%,
            transparent 60%
          );
        }

        .glitch-3 {
          animation-delay: 0.2s;
          animation-duration: 0.4s;
          background: linear-gradient(
            90deg,
            transparent 20%,
            rgba(147, 197, 253, 0.05) 20%,
            rgba(147, 197, 253, 0.05) 80%,
            transparent 80%
          );
        }

        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ComingSoonPage;