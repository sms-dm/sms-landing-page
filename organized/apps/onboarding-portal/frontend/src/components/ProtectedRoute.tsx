import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { LoadingScreen } from './LoadingScreen';
import { useMockAuth } from '@/hooks/useMockAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { isDemoMode, getMockUser } = useMockAuth();

  // In demo mode, check for mock user
  if (isDemoMode) {
    const mockUser = getMockUser();
    if (mockUser) {
      return <Outlet />;
    }
    return <Navigate to="/demo" replace />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}