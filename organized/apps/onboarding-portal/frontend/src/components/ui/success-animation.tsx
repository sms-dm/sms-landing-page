import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function SuccessAnimation({ 
  show, 
  message = 'Success!', 
  onComplete,
  size = 'md' 
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <div className={cn('relative', sizeClasses[size])}>
          <svg
            className="w-full h-full animate-bounceIn"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              className="text-green-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset="283"
              className="text-green-500 animate-[draw_0.5s_ease-out_forwards]"
            />
            <path
              d="M 30 50 L 45 65 L 70 35"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              strokeDashoffset="50"
              className="text-green-500 animate-checkmark"
              style={{ animationDelay: '0.5s' }}
            />
          </svg>
        </div>
        {message && (
          <p className="text-lg font-medium text-green-700 animate-slideIn">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Inline success indicator for forms
export function InlineSuccess({ 
  message = 'Saved successfully',
  className 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm text-green-600',
      'animate-slideIn',
      className
    )}>
      <svg
        className="w-4 h-4"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="10"
          cy="10"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-[draw_0.3s_ease-out_forwards]"
        />
        <path
          d="M 6 10 L 9 13 L 14 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-checkmark"
          style={{ animationDelay: '0.3s' }}
        />
      </svg>
      <span className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
        {message}
      </span>
    </div>
  );
}