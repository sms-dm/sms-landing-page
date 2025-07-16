import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

interface ProgressIndicatorProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

export function ProgressIndicator({
  value,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'linear',
  color = 'primary',
  animated = true,
}: ProgressIndicatorProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  if (variant === 'circular') {
    const sizeClasses = {
      sm: 'w-12 h-12',
      md: 'w-20 h-20',
      lg: 'w-32 h-32',
    };

    const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (displayValue / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('relative', sizeClasses[size])}>
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-700 ease-out',
                colorClasses[color]
              )}
              style={{
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'font-semibold',
                size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
              )}>
                {Math.round(displayValue)}%
              </span>
            </div>
          )}
        </div>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    );
  }

  // Linear variant
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium">{Math.round(displayValue)}%</span>
          )}
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        heightClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-700 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}

// Step progress indicator
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  variant?: 'dots' | 'numbers' | 'checks';
}

export function StepProgress({ 
  steps, 
  currentStep, 
  variant = 'dots' 
}: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                  'bg-background border-2',
                  {
                    'border-primary bg-primary text-primary-foreground': isActive || isCompleted,
                    'border-gray-300 dark:border-gray-600': !isActive && !isCompleted,
                    'scale-110': isActive,
                  }
                )}
              >
                {variant === 'dots' && (
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    (isActive || isCompleted) ? 'bg-white' : 'bg-gray-400'
                  )} />
                )}
                {variant === 'numbers' && (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
                {variant === 'checks' && isCompleted && (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={cn(
                'text-xs whitespace-nowrap',
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// File upload progress
interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function UploadProgress({ 
  fileName, 
  progress, 
  status, 
  error 
}: UploadProgressProps) {
  return (
    <div className="w-full p-4 border rounded-lg space-y-2 animate-slideIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded flex items-center justify-center',
            {
              'bg-blue-100 text-blue-600': status === 'uploading',
              'bg-green-100 text-green-600': status === 'completed',
              'bg-red-100 text-red-600': status === 'error',
            }
          )}>
            {status === 'uploading' && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'completed' && (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <ProgressIndicator
        value={progress}
        size="sm"
        showPercentage={false}
        color={status === 'error' ? 'danger' : status === 'completed' ? 'success' : 'primary'}
      />
    </div>
  );
}