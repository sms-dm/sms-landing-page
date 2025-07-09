import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!user || isLoading) return;

    // Redirect based on user role
    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        navigate('/admin/dashboard', { replace: true });
        break;
      case UserRole.MANAGER:
        navigate('/manager/review', { replace: true });
        break;
      case UserRole.TECHNICIAN:
        navigate('/tech/assignments', { replace: true });
        break;
      case UserRole.HSE_OFFICER:
        navigate('/manager/review', { replace: true }); // HSE officers go to manager view
        break;
      default:
        navigate('/profile', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return <LoadingScreen />;
}