import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

// Tooltip step configuration
export interface TooltipStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  highlightPadding?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tour configuration
export interface OnboardingTourConfig {
  id: string;
  steps: TooltipStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  allowKeyboardNavigation?: boolean;
  allowClickOutside?: boolean;
  persistKey?: string; // LocalStorage key to remember if tour was completed
}

interface OnboardingTooltipProps {
  config: OnboardingTourConfig;
  isActive: boolean;
  onClose: () => void;
}

export function OnboardingTooltip({ config, isActive, onClose }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const step = config.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === config.steps.length - 1;

  // Check if tour was already completed
  useEffect(() => {
    if (config.persistKey) {
      const completed = localStorage.getItem(`onboarding_${config.persistKey}`);
      if (completed === 'true' && isActive) {
        onClose();
      }
    }
  }, [config.persistKey, isActive, onClose]);

  // Update target element position
  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    
    // Update on window resize or scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive || !config.allowKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'Escape':
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, config.allowKeyboardNavigation]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    config.onSkip?.();
    onClose();
  };

  const handleComplete = () => {
    if (config.persistKey) {
      localStorage.setItem(`onboarding_${config.persistKey}`, 'true');
    }
    config.onComplete?.();
    onClose();
  };

  const getTooltipPosition = () => {
    if (!targetRect || !tooltipRef.current) return { top: 0, left: 0 };

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 10;
    
    let top = 0;
    let left = 0;

    const placement = step.placement || 'auto';

    // Auto placement logic
    if (placement === 'auto') {
      const spaceAbove = targetRect.top;
      const spaceBelow = window.innerHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = window.innerWidth - targetRect.right;

      if (spaceBelow > tooltipRect.height + padding) {
        // Place below
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      } else if (spaceAbove > tooltipRect.height + padding) {
        // Place above
        top = targetRect.top - tooltipRect.height - padding;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      } else if (spaceRight > tooltipRect.width + padding) {
        // Place right
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + padding;
      } else if (spaceLeft > tooltipRect.width + padding) {
        // Place left
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - padding;
      }
    } else {
      // Manual placement
      switch (placement) {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - padding;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + padding;
          break;
      }
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    return { top, left };
  };

  if (!isActive || !targetRect) return null;

  const position = getTooltipPosition();
  const highlightPadding = step.highlightPadding || 8;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 animate-fadeIn"
        onClick={config.allowClickOutside ? handleSkip : undefined}
      />
      
      {/* Highlight */}
      <div
        ref={highlightRef}
        className="fixed z-[9999] pointer-events-none animate-fadeIn"
        style={{
          top: targetRect.top - highlightPadding,
          left: targetRect.left - highlightPadding,
          width: targetRect.width + highlightPadding * 2,
          height: targetRect.height + highlightPadding * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
        }}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] max-w-md animate-slideIn"
        style={{ top: position.top, left: position.left }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">{step.content}</p>
          
          {/* Action button if provided */}
          {step.action && (
            <div className="mb-6">
              <Button
                onClick={step.action.onClick}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {step.action.label}
              </Button>
            </div>
          )}
          
          {/* Progress */}
          {config.showProgress && (
            <div className="flex items-center gap-1 mb-4">
              {config.steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    index <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Skip tour
            </button>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrevious}
                disabled={isFirstStep}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                {currentStep + 1} / {config.steps.length}
              </span>
              
              <Button
                onClick={handleNext}
                variant="default"
                size="sm"
              >
                {isLastStep ? 'Finish' : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// Hook for managing onboarding tours
export function useOnboardingTour(config: OnboardingTourConfig) {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    // Check if tour was already completed
    if (config.persistKey) {
      const completed = localStorage.getItem(`onboarding_${config.persistKey}`);
      if (completed === 'true') {
        return;
      }
    }
    setIsActive(true);
  };

  const endTour = () => {
    setIsActive(false);
  };

  const resetTour = () => {
    if (config.persistKey) {
      localStorage.removeItem(`onboarding_${config.persistKey}`);
    }
  };

  return {
    isActive,
    startTour,
    endTour,
    resetTour,
    TooltipComponent: (
      <OnboardingTooltip
        config={config}
        isActive={isActive}
        onClose={endTour}
      />
    ),
  };
}

// Spotlight component for highlighting features
interface SpotlightProps {
  target: string;
  children: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export function Spotlight({ target, children, isActive = false, onClick }: SpotlightProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  useEffect(() => {
    const element = document.querySelector(target);
    setTargetElement(element);
  }, [target]);

  if (!isActive || !targetElement) {
    return <>{children}</>;
  }

  const rect = targetElement.getBoundingClientRect();

  return (
    <>
      {children}
      {createPortal(
        <div
          className="fixed z-[9999] pointer-events-none animate-pulse"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            border: '2px solid #3B82F6',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
          }}
          onClick={onClick}
        />,
        document.body
      )}
    </>
  );
}