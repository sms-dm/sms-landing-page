import React, { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale';
  duration?: number;
}

export function PageTransition({ 
  children, 
  variant = 'fade',
  duration = 300 
}: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fade-in');

  useEffect(() => {
    setTransitionStage('fade-out');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('fade-in');
    }, duration);

    return () => clearTimeout(timer);
  }, [location.pathname, children, duration]);

  const baseClasses = 'transition-all';
  const durationClass = `duration-${duration}`;

  const variantClasses = {
    fade: {
      'fade-in': 'opacity-100',
      'fade-out': 'opacity-0',
    },
    slide: {
      'fade-in': 'opacity-100 translate-x-0',
      'fade-out': 'opacity-0 -translate-x-4',
    },
    scale: {
      'fade-in': 'opacity-100 scale-100',
      'fade-out': 'opacity-0 scale-95',
    },
  };

  return (
    <div
      className={cn(
        baseClasses,
        durationClass,
        variantClasses[variant][transitionStage as keyof typeof variantClasses[typeof variant]]
      )}
    >
      {displayChildren}
    </div>
  );
}

// Layout transition wrapper for smooth transitions between different layouts
interface LayoutTransitionProps {
  children: ReactNode;
  layoutKey: string;
}

export function LayoutTransition({ children, layoutKey }: LayoutTransitionProps) {
  const [currentLayout, setCurrentLayout] = useState(layoutKey);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (layoutKey !== currentLayout) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentLayout(layoutKey);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [layoutKey, currentLayout]);

  return (
    <div className={cn(
      'min-h-screen transition-opacity duration-150',
      isTransitioning && 'opacity-0'
    )}>
      {children}
    </div>
  );
}

// Animated route wrapper
export function AnimatedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Reset animation on route change
    setShow(false);
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {children}
    </div>
  );
}

// Stagger children animation
interface StaggerChildrenProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function StaggerChildren({ 
  children, 
  delay = 50,
  className 
}: StaggerChildrenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={cn(
            'transition-all duration-500 ease-out',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            transitionDelay: mounted ? `${index * delay}ms` : '0ms',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Crossfade transition
interface CrossfadeProps {
  children: ReactNode;
  transitionKey: string;
}

export function Crossfade({ children, transitionKey }: CrossfadeProps) {
  const [currentKey, setCurrentKey] = useState(transitionKey);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [stage, setStage] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setStage('fade-out');
      const fadeOutTimer = setTimeout(() => {
        setCurrentChildren(children);
        setCurrentKey(transitionKey);
        setStage('fade-in');
      }, 200);

      const fadeInTimer = setTimeout(() => {
        setStage('idle');
      }, 400);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    }
  }, [transitionKey, currentKey, children]);

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        stage === 'fade-out' && 'opacity-0',
        stage === 'fade-in' && 'opacity-100',
        stage === 'idle' && 'opacity-100'
      )}
    >
      {currentChildren}
    </div>
  );
}

// Export a hook for programmatic transitions
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = (callback: () => void, duration = 300) => {
    setIsTransitioning(true);
    setTimeout(() => {
      callback();
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, duration);
  };

  return { isTransitioning, startTransition };
}