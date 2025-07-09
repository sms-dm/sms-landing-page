import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera, History, Settings, ArrowLeft } from 'lucide-react';
import { SyncStatus } from '../components/SyncStatus';
import { useAuth } from '@/hooks/useAuth';
import '../styles/mobile.css';

export const TechnicianLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.includes(path);

  const showBackButton = location.pathname !== '/tech/assignments';

  return (
    <div className="tech-interface min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold">SMS Technician</h1>
              <p className="text-xs text-gray-600">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <SyncStatus />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/tech/assignments"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive('/tech/assignments')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Assignments</span>
          </Link>

          <Link
            to="/tech/capture"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive('/tech/capture')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Capture</span>
          </Link>

          <Link
            to="/tech/history"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive('/tech/history')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive('/settings')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};