import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SMSToaster } from './utils/toast';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import CompanyLogin from './pages/CompanyLogin';
import VesselSelect from './pages/VesselSelect';
import VesselIntroduction from './pages/VesselIntroduction';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import InternalPortal from './pages/InternalPortal';
import MechanicDashboard from './pages/MechanicDashboard';
import HSEDashboard from './pages/HSEDashboard';
import ElectricalManagerDashboard from './pages/ElectricalManagerDashboard';
import MechanicalManagerDashboard from './pages/MechanicalManagerDashboard';
import HSEManagerDashboard from './pages/HSEManagerDashboard';
import EquipmentDetail from './pages/EquipmentDetail';
import EmergencyOrder from './pages/EmergencyOrder';
import QRScanner from './pages/QRScanner';
import HandoverComplete from './pages/HandoverComplete';
import CriticalFault from './pages/CriticalFault';
import MinorFault from './pages/MinorFault';
import FaultDiagnostic from './pages/FaultDiagnostic';
import FaultComplete from './pages/FaultComplete';
import DirectFix from './pages/DirectFix';
import EquipmentManagement from './pages/EquipmentManagement';
import EquipmentListWithTransfer from './pages/EquipmentListWithTransfer';
import MaintenanceCalendar from './pages/MaintenanceCalendar';
import Records from './pages/Records';
import Inventory from './pages/Inventory';
import PrivateChat from './pages/PrivateChat';
import FeedbackManagement from './pages/FeedbackManagement';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserSettings from './pages/UserSettings';
import ActivationCodesPage from './pages/ActivationCodesPage';
import Analytics from './pages/Analytics';

// Components
import PrivateRoute from './components/PrivateRoute';
import FeedbackWidget from './components/FeedbackWidget';
import MaintenanceGateWrapper from './components/MaintenanceGateWrapper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-sms-dark">
            <Routes>
              {/* Company branded login */}
              <Route path="/:companySlug" element={<CompanyLogin />} />
              
              {/* Password reset routes */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Vessel selection */}
              <Route
                path="/vessels"
                element={
                  <PrivateRoute>
                    <VesselSelect />
                  </PrivateRoute>
                }
              />
              
              {/* Vessel introduction for first-time joiners */}
              <Route
                path="/vessel-introduction"
                element={
                  <PrivateRoute>
                    <VesselIntroduction />
                  </PrivateRoute>
                }
              />
              
              {/* Role-based dashboards */}
              <Route
                path="/dashboard/technician"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <MaintenanceGateWrapper>
                      <TechnicianDashboard />
                    </MaintenanceGateWrapper>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/manager"
                element={
                  <PrivateRoute allowedRoles={['manager', 'admin']}>
                    <ManagerDashboard />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/internal"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <InternalPortal />
                  </PrivateRoute>
                }
              />
              
              {/* Specialized dashboards */}
              <Route
                path="/dashboard/mechanic"
                element={
                  <PrivateRoute allowedRoles={['mechanic', 'technician']}>
                    <MaintenanceGateWrapper>
                      <MechanicDashboard />
                    </MaintenanceGateWrapper>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/hse"
                element={
                  <PrivateRoute allowedRoles={['hse', 'technician']}>
                    <HSEDashboard />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/electrical-manager"
                element={
                  <PrivateRoute allowedRoles={['electrical_manager', 'manager', 'admin']}>
                    <ElectricalManagerDashboard />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/mechanical-manager"
                element={
                  <PrivateRoute allowedRoles={['mechanical_manager', 'manager', 'admin']}>
                    <MechanicalManagerDashboard />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard/hse-manager"
                element={
                  <PrivateRoute allowedRoles={['hse_manager', 'manager', 'admin']}>
                    <HSEManagerDashboard />
                  </PrivateRoute>
                }
              />
              
              {/* QR Scanner */}
              <Route
                path="/equipment/scan"
                element={
                  <PrivateRoute>
                    <QRScanner />
                  </PrivateRoute>
                }
              />
              
              {/* Equipment Management */}
              <Route
                path="/equipment/management"
                element={
                  <PrivateRoute>
                    <EquipmentManagement />
                  </PrivateRoute>
                }
              />
              
              {/* Equipment Transfer Management */}
              <Route
                path="/equipment/transfers"
                element={
                  <PrivateRoute allowedRoles={['manager', 'admin']}>
                    <EquipmentListWithTransfer />
                  </PrivateRoute>
                }
              />
              
              {/* Maintenance Calendar */}
              <Route
                path="/maintenance"
                element={
                  <PrivateRoute>
                    <MaintenanceCalendar />
                  </PrivateRoute>
                }
              />
              
              {/* Inventory Management */}
              <Route
                path="/inventory"
                element={
                  <PrivateRoute allowedRoles={['technician', 'manager', 'admin']}>
                    <Inventory />
                  </PrivateRoute>
                }
              />
              
              {/* Records */}
              <Route
                path="/records"
                element={
                  <PrivateRoute>
                    <Records />
                  </PrivateRoute>
                }
              />
              
              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  <PrivateRoute allowedRoles={['manager', 'admin']}>
                    <Analytics />
                  </PrivateRoute>
                }
              />
              
              {/* Equipment details */}
              <Route
                path="/equipment/:equipmentId"
                element={
                  <PrivateRoute>
                    <EquipmentDetail />
                  </PrivateRoute>
                }
              />
              
              {/* Emergency Order Form */}
              <Route
                path="/emergency-order"
                element={
                  <PrivateRoute>
                    <EmergencyOrder />
                  </PrivateRoute>
                }
              />
              
              {/* Fault Management Routes */}
              <Route
                path="/fault/critical"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <CriticalFault />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/fault/minor"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <MinorFault />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/fault/diagnostic"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <FaultDiagnostic />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/fault/complete"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <FaultComplete />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/fault/direct-fix"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <DirectFix />
                  </PrivateRoute>
                }
              />
              
              {/* Handover Completion Form */}
              <Route
                path="/handover/complete"
                element={
                  <PrivateRoute allowedRoles={['technician']}>
                    <HandoverComplete />
                  </PrivateRoute>
                }
              />
              
              
              {/* Private Chat */}
              <Route
                path="/ai-counselor"
                element={
                  <PrivateRoute>
                    <PrivateChat />
                  </PrivateRoute>
                }
              />
              
              {/* Feedback Management (Admin only) */}
              <Route
                path="/feedback"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <FeedbackManagement />
                  </PrivateRoute>
                }
              />
              
              {/* Activation Code Management (Admin only) */}
              <Route
                path="/admin/activation-codes"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <ActivationCodesPage />
                  </PrivateRoute>
                }
              />
              
              {/* User Settings */}
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <UserSettings />
                  </PrivateRoute>
                }
              />
              
              {/* Default redirect to demo company */}
              <Route path="/" element={<Navigate to="/oceanic" replace />} />
            </Routes>
            
            <SMSToaster />
            {/* Feedback Widget - appears on all pages */}
            <FeedbackWidget />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
