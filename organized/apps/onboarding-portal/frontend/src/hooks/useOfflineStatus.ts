import { useState, useEffect } from 'react';
import { useMockAuth } from './useMockAuth';

export function useOfflineStatus() {
  const { isDemoMode } = useMockAuth();
  const [isOffline, setIsOffline] = useState(!isDemoMode && !navigator.onLine);

  useEffect(() => {
    // If in demo mode, always return online
    if (isDemoMode) {
      setIsOffline(false);
      return;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDemoMode]);

  return isOffline;
}