import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

export function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Outlet />
        </div>
      </div>
      
      {/* Right side - Brand image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-sms-navy to-sms-blue">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-4">SMS Onboarding</h1>
              <p className="text-xl">Professional vessel onboarding made simple</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}