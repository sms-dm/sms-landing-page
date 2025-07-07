import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { UserRole } from '@/types';
import { useMockAuth } from '@/hooks/useMockAuth';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { isDemoMode, getMockUser } = useMockAuth();

  // In demo mode, check mock user role
  if (isDemoMode) {
    const mockUser = getMockUser();
    if (!mockUser || !allowedRoles.includes(mockUser.role)) {
      return <Navigate to={redirectTo} replace />;
    }
    return <Outlet />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}