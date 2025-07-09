import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { user } = useAppSelector((state) => state.auth);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}