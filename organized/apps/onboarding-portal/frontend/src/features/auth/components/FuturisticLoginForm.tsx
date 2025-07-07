import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toaster';

export function FuturisticLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-grid-move" 
          style={{
            backgroundImage: `linear-gradient(to right, #00CED1 1px, transparent 1px), 
                             linear-gradient(to bottom, #00CED1 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Ocean Waves Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
        <svg className="absolute bottom-0 w-full h-full animate-wave" viewBox="0 0 1440 320">
          <path fill="#00CED1" fillOpacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,213.3C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute bottom-0 w-full h-full animate-wave" style={{ animationDelay: '10s' }} viewBox="0 0 1440 320">
          <path fill="#003366" fillOpacity="0.05" d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,96C672,96,768,128,864,149.3C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-sms-cyan/20 to-blue-500/20 blur-xl rounded-2xl" />
        
        <div className="relative bg-sms-gray/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/images/sms-logo.svg" 
              alt="SMS Logo" 
              className="h-20 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white">Smart Maintenance System</h2>
            <p className="text-gray-300 mt-2">Onboarding Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan focus:ring-1 focus:ring-sms-cyan transition-colors"
                  placeholder="admin@demo.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan focus:ring-1 focus:ring-sms-cyan transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-sms-cyan to-sms-blue text-white font-semibold rounded-lg shadow-[0_4px_15px_0_rgba(0,206,209,0.2)] hover:shadow-[0_6px_20px_0_rgba(0,206,209,0.3)] transition-all duration-300 relative overflow-hidden group"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-sms-dark/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Admin: admin@demo.com / Demo123!</p>
              <p>Manager: manager@demo.com / Demo123!</p>
              <p>Tech: tech@demo.com / Demo123!</p>
              <p>HSE: hse@demo.com / Demo123!</p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-sms-cyan hover:text-white transition-colors">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}