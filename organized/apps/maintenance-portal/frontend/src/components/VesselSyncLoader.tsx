import React, { useEffect, useState } from 'react';

interface VesselSyncLoaderProps {
  vesselName: string;
  companyName: string;
  companyLogo?: string;
  onComplete: () => void;
}

const VesselSyncLoader: React.FC<VesselSyncLoaderProps> = ({
  vesselName,
  companyName,
  companyLogo,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing connection...');

  useEffect(() => {
    const stages = [
      { progress: 20, text: 'Establishing secure connection...', delay: 500 },
      { progress: 40, text: 'Authenticating credentials...', delay: 1000 },
      { progress: 60, text: 'Loading vessel configuration...', delay: 1500 },
      { progress: 80, text: 'Synchronizing equipment data...', delay: 2000 },
      { progress: 100, text: 'Welcome aboard!', delay: 2500 }
    ];

    stages.forEach(({ progress, text, delay }) => {
      setTimeout(() => {
        setProgress(progress);
        setStatusText(text);
        if (progress === 100) {
          setTimeout(onComplete, 1000);
        }
      }, delay);
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-sms-dark flex items-center justify-center z-50">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-sms-cyan to-transparent"
              style={{
                top: `${Math.random() * 100}%`,
                left: '-100%',
                right: '-100%',
                animation: `scan ${10 + Math.random() * 10}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        {/* Company Logo */}
        {companyLogo && (
          <div className="mb-8 animate-fade-in">
            <img 
              src={companyLogo} 
              alt={companyName}
              className="h-16 mx-auto filter brightness-200"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 206, 209, 0.5))' }}
            />
          </div>
        )}

        {/* Welcome Text */}
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">
            SMART MAINTENANCE SYSTEM
          </h1>
          <p className="text-sms-cyan text-lg tracking-widest uppercase">
            The Future of Maintenance Today
          </p>
        </div>

        {/* Vessel Name */}
        <div className="mb-12">
          <p className="text-gray-400 text-sm mb-1">Connecting to</p>
          <h2 className="text-2xl font-semibold text-white">{vesselName}</h2>
        </div>

        {/* Progress Bar Container */}
        <div className="mb-4">
          <div className="w-64 h-2 bg-sms-gray rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sms-cyan to-blue-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <p className="text-gray-400 text-sm animate-pulse">
          {statusText}
        </p>

        {/* Loading Spinner */}
        <div className="mt-8 flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-sms-cyan rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-sms-cyan/30"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-sms-cyan/30"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-sms-cyan/30"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-sms-cyan/30"></div>

    </div>
  );
};

export default VesselSyncLoader;