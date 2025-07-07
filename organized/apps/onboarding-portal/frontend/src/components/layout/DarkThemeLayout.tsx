import React from 'react';
import { cn } from '@/utils/cn';

interface DarkThemeLayoutProps {
  children: React.ReactNode;
  className?: string;
  showWaves?: boolean;
  showGrid?: boolean;
}

export function DarkThemeLayout({ 
  children, 
  className,
  showWaves = true,
  showGrid = true 
}: DarkThemeLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray relative overflow-hidden">
      {/* Animated Grid Background */}
      {showGrid && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-grid-move" 
            style={{
              backgroundImage: `linear-gradient(to right, #00CED1 1px, transparent 1px), 
                               linear-gradient(to bottom, #00CED1 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>
      )}

      {/* Ocean Waves Animation */}
      {showWaves && (
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
          <svg className="absolute bottom-0 w-full h-full animate-wave" viewBox="0 0 1440 320">
            <path fill="#00CED1" fillOpacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,213.3C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg className="absolute bottom-0 w-full h-full animate-wave" style={{ animationDelay: '10s' }} viewBox="0 0 1440 320">
            <path fill="#003366" fillOpacity="0.05" d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,96C672,96,768,128,864,149.3C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      )}

      {/* Content */}
      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  );
}

// Glass Card Component
export function GlassCard({ 
  children, 
  className,
  glow = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-sms-cyan/20 to-blue-500/20 blur-xl rounded-2xl" />
      )}
      <div className="relative bg-sms-gray/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
        {children}
      </div>
    </div>
  );
}

// Consistent Page Header
export function PageHeader({ 
  title, 
  subtitle 
}: { 
  title: string; 
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      {subtitle && <p className="text-gray-300">{subtitle}</p>}
    </div>
  );
}