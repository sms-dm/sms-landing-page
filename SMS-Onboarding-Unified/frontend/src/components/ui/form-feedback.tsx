import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';

interface FormFeedbackProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
  showIcon?: boolean;
  autoHide?: boolean;
  autoHideDuration?: number;
}

export function FormFeedback({
  status,
  message,
  className,
  showIcon = true,
  autoHide = true,
  autoHideDuration = 3000,
}: FormFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setIsVisible(true);
      
      if (autoHide && (status === 'success' || status === 'error')) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [status, autoHide, autoHideDuration]);

  if (!isVisible) return null;

  const icons = {
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  };

  const styles = {
    loading: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    success: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
        'animate-slideIn transition-all duration-300',
        styles[status as keyof typeof styles],
        className
      )}
    >
      {showIcon && icons[status as keyof typeof icons]}
      {message || (
        status === 'loading' ? 'Saving...' :
        status === 'success' ? 'Saved successfully!' :
        'An error occurred'
      )}
    </div>
  );
}

// Submit button with built-in loading states
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  children: React.ReactNode;
}

export function SubmitButton({
  isLoading = false,
  isSuccess = false,
  loadingText = 'Saving...',
  successText = 'Saved!',
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <Button
      type="submit"
      disabled={disabled || isLoading}
      className={cn(
        'relative min-w-[120px] transition-all duration-300',
        showSuccess && 'bg-green-600 hover:bg-green-700',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'flex items-center justify-center gap-2 transition-all duration-300',
          (isLoading || showSuccess) && 'opacity-0'
        )}
      >
        {children}
      </span>
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </span>
      )}
      
      {showSuccess && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 animate-slideIn">
          <CheckCircle className="w-4 h-4" />
          {successText}
        </span>
      )}
    </Button>
  );
}

// Inline save indicator
interface InlineSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export function InlineSaveIndicator({ status, className }: InlineSaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        'transition-all duration-300 animate-fadeIn',
        {
          'text-gray-500': status === 'saving',
          'text-green-600': status === 'saved',
          'text-red-600': status === 'error',
        },
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle className="w-3 h-3 animate-bounceIn" />
          Saved
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3" />
          Error saving
        </>
      )}
    </div>
  );
}

// Form field with validation feedback
interface FormFieldFeedbackProps {
  error?: string;
  touched?: boolean;
  success?: boolean;
  className?: string;
}

export function FormFieldFeedback({ 
  error, 
  touched, 
  success,
  className 
}: FormFieldFeedbackProps) {
  const showError = error && touched;
  const showSuccess = success && touched && !error;

  return (
    <>
      {showError && (
        <p className={cn(
          'mt-1 text-sm text-red-600 animate-slideIn',
          className
        )}>
          {error}
        </p>
      )}
      {showSuccess && (
        <p className={cn(
          'mt-1 text-sm text-green-600 animate-slideIn flex items-center gap-1',
          className
        )}>
          <CheckCircle className="w-3 h-3" />
          Looks good!
        </p>
      )}
    </>
  );
}

// Progress steps for multi-step forms
interface FormProgressProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep: number;
  onStepClick?: (index: number) => void;
  allowStepClick?: boolean;
}

export function FormProgress({ 
  steps, 
  currentStep, 
  onStepClick,
  allowStepClick = false 
}: FormProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%` 
          }}
        />
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = allowStepClick && (isCompleted || index === currentStep + 1);
          
          return (
            <div
              key={step.id}
              className={cn(
                'relative z-10 flex flex-col items-center',
                isClickable && 'cursor-pointer'
              )}
              onClick={() => isClickable && onStepClick?.(index)}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-all duration-300 bg-background',
                  {
                    'border-2 border-primary text-primary': isActive,
                    'bg-primary text-primary-foreground': isCompleted,
                    'border-2 border-gray-300 dark:border-gray-600': !isActive && !isCompleted,
                    'hover:border-primary': isClickable && !isActive && !isCompleted,
                    'scale-110': isActive,
                  }
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              
              <div className="mt-2 text-center">
                <p className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Auto-save indicator
export function AutoSaveIndicator({ 
  lastSaved,
  isSaving = false 
}: { 
  lastSaved?: Date;
  isSaving?: boolean;
}) {
  const [displayTime, setDisplayTime] = useState<string>('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setDisplayTime(`${hours}h ago`);
      } else if (minutes > 0) {
        setDisplayTime(`${minutes}m ago`);
      } else if (seconds > 10) {
        setDisplayTime(`${seconds}s ago`);
      } else {
        setDisplayTime('Just now');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isSaving ? (
        <>
          <Save className="w-3 h-3 animate-pulse" />
          Saving...
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle className="w-3 h-3 text-green-600" />
          Saved {displayTime}
        </>
      ) : null}
    </div>
  );
}