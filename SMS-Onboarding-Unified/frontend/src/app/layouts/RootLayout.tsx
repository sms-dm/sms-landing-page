import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { initializeAuth } from '@/store/slices/authSlice';

export function RootLayout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize authentication state on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}