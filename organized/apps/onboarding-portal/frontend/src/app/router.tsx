import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { UserRole } from '@/types';

// Layout components
import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));

// Common pages
const DashboardPage = lazy(() => import('@/features/common/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/features/common/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/features/common/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/features/common/pages/NotFoundPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/features/admin').then(module => ({ default: module.AdminDashboard })));
const CompanyManagementPage = lazy(() => import('@/features/admin/pages/CompanyManagementPage'));
const VesselManagementPage = lazy(() => import('@/features/admin/pages/VesselManagementPage'));
const TokenManagementPage = lazy(() => import('@/features/admin/pages/TokenManagementPage'));
const UserManagementPage = lazy(() => import('@/features/admin/pages/UserManagementPage'));
const AdminReportsPage = lazy(() => import('@/features/admin/pages/AdminReportsPage'));

// Technician pages
const MyAssignmentsPage = lazy(() => import('@/features/tech/components/MyAssignments').then(module => ({ default: module.MyAssignments })));
const OnboardingFlowPage = lazy(() => import('@/features/tech/components/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })));
const OnboardingSessionPage = lazy(() => import('@/features/tech/pages/OnboardingSessionPage'));
const EquipmentListPage = lazy(() => import('@/features/tech/pages/EquipmentListPage'));
const EquipmentFormPage = lazy(() => import('@/features/tech/pages/EquipmentFormPage'));
const EquipmentDetailPage = lazy(() => import('@/features/tech/pages/EquipmentDetailPage'));
const OfflineSyncPage = lazy(() => import('@/features/tech/pages/OfflineSyncPage'));

// Manager pages
const ReviewDashboardPage = lazy(() => import('@/features/manager/pages/ReviewDashboardPage'));
const EquipmentReviewPage = lazy(() => import('@/features/manager/pages/EquipmentReviewPage'));
const QualityReportPage = lazy(() => import('@/features/manager/pages/QualityReportPage'));
const ApprovalWorkflowPage = lazy(() => import('@/features/manager/pages/ApprovalWorkflowPage'));
const ExportDataPage = lazy(() => import('@/features/manager/pages/ExportDataPage'));
const EquipmentManagementPage = lazy(() => import('@/features/manager/pages/EquipmentManagementPage'));
const VesselEquipmentReviewPage = lazy(() => import('@/features/manager/pages/VesselEquipmentReviewPage'));
const VerificationManagementPage = lazy(() => import('@/features/manager/pages/VerificationManagementPage'));

// HSE pages
const HSEOnboardingPage = lazy(() => import('@/features/hse/components/HSEOnboardingPage').then(module => ({ default: module.HSEOnboardingPage })));

// Demo page
const DemoSelector = lazy(() => import('@/pages/DemoSelector'));

// Helper component for lazy loading
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'demo',
        element: (
          <LazyPage>
            <DemoSelector />
          </LazyPage>
        ),
      },
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <LazyPage>
                <LoginPage />
              </LazyPage>
            ),
          },
          {
            path: 'register',
            element: (
              <LazyPage>
                <RegisterPage />
              </LazyPage>
            ),
          },
          {
            path: 'forgot-password',
            element: (
              <LazyPage>
                <ForgotPasswordPage />
              </LazyPage>
            ),
          },
          {
            path: 'reset-password',
            element: (
              <LazyPage>
                <ResetPasswordPage />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: 'dashboard',
                element: (
                  <LazyPage>
                    <DashboardPage />
                  </LazyPage>
                ),
              },
              {
                path: 'profile',
                element: (
                  <LazyPage>
                    <ProfilePage />
                  </LazyPage>
                ),
              },
              {
                path: 'settings',
                element: (
                  <LazyPage>
                    <SettingsPage />
                  </LazyPage>
                ),
              },
              // Admin routes
              {
                path: 'admin',
                element: <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} />,
                children: [
                  {
                    index: true,
                    element: (
                      <LazyPage>
                        <AdminDashboard />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'dashboard',
                    element: (
                      <LazyPage>
                        <AdminDashboard />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'companies',
                    element: (
                      <LazyPage>
                        <CompanyManagementPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'vessels',
                    element: (
                      <LazyPage>
                        <VesselManagementPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'tokens',
                    element: (
                      <LazyPage>
                        <TokenManagementPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'users',
                    element: (
                      <LazyPage>
                        <UserManagementPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'reports',
                    element: (
                      <LazyPage>
                        <AdminReportsPage />
                      </LazyPage>
                    ),
                  },
                ],
              },
              // Technician routes
              {
                path: 'tech',
                element: <RoleGuard allowedRoles={[UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]} />,
                children: [
                  {
                    path: 'assignments',
                    element: (
                      <LazyPage>
                        <MyAssignmentsPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'assignment/:assignmentId',
                    element: (
                      <LazyPage>
                        <OnboardingFlowPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'session',
                    element: (
                      <LazyPage>
                        <OnboardingSessionPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'equipment',
                    element: (
                      <LazyPage>
                        <EquipmentListPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'equipment/new',
                    element: (
                      <LazyPage>
                        <EquipmentFormPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'equipment/:id',
                    element: (
                      <LazyPage>
                        <EquipmentDetailPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'equipment/:id/edit',
                    element: (
                      <LazyPage>
                        <EquipmentFormPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'sync',
                    element: (
                      <LazyPage>
                        <OfflineSyncPage />
                      </LazyPage>
                    ),
                  },
                ],
              },
              // Manager routes
              {
                path: 'manager',
                element: <RoleGuard allowedRoles={[UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} />,
                children: [
                  {
                    path: 'review',
                    element: (
                      <LazyPage>
                        <ReviewDashboardPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'review/:vesselId',
                    element: (
                      <LazyPage>
                        <EquipmentReviewPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'quality',
                    element: (
                      <LazyPage>
                        <QualityReportPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'approval',
                    element: (
                      <LazyPage>
                        <ApprovalWorkflowPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'vessels/:vesselId/equipment',
                    element: (
                      <LazyPage>
                        <VesselEquipmentReviewPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'export',
                    element: (
                      <LazyPage>
                        <ExportDataPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'equipment',
                    element: (
                      <LazyPage>
                        <EquipmentManagementPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'verifications',
                    element: (
                      <LazyPage>
                        <VerificationManagementPage />
                      </LazyPage>
                    ),
                  },
                ],
              },
              // HSE routes
              {
                path: 'hse',
                element: <RoleGuard allowedRoles={[UserRole.HSE_OFFICER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} />,
                children: [
                  {
                    path: 'vessels/:vesselId/onboarding',
                    element: (
                      <LazyPage>
                        <HSEOnboardingPage />
                      </LazyPage>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <LazyPage>
            <NotFoundPage />
          </LazyPage>
        ),
      },
    ],
  },
]);