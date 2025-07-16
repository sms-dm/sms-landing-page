import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOffline = useOfflineStatus();

  return (
    <div className="flex h-screen bg-sms-gray-50">
      {/* Mobile sidebar */}
      <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <p className="text-sm text-yellow-800">
              You are currently offline. Changes will be synced when connection is restored.
            </p>
          </div>
        )}
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container-fluid py-6">
            <Outlet />
          </div>
        </main>
        
        {/* Sync indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <SyncStatusIndicator showDetails={true} />
        </div>
      </div>
    </div>
  );
}