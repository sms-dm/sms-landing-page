import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}