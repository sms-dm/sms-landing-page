import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { initializeAuth } from '@/store/slices/authSlice';
import { useMockAuth } from '@/hooks/useMockAuth';

export function RootLayout() {
  const dispatch = useAppDispatch();
  const { isDemoMode } = useMockAuth();

  useEffect(() => {
    // Skip auth initialization in demo mode
    if (!isDemoMode) {
      // Initialize authentication state on app load
      dispatch(initializeAuth());
    }
  }, [dispatch, isDemoMode]);

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}