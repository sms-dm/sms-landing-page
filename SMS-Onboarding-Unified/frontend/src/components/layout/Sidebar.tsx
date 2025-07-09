import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { 
  LayoutDashboard, 
  Ship, 
  Wrench, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  Shield,
  CheckSquare,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

const navigation = {
  [UserRole.ADMIN]: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Companies', href: '/admin/companies', icon: Users },
    { name: 'Vessels', href: '/admin/vessels', icon: Ship },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  [UserRole.MANAGER]: [
    { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { name: 'Equipment', href: '/manager/equipment', icon: Package },
    { name: 'Review', href: '/manager/review', icon: CheckSquare },
    { name: 'Quality Reports', href: '/manager/quality', icon: FileText },
    { name: 'Analytics', href: '/manager/analytics', icon: BarChart3 },
    { name: 'Export', href: '/manager/export', icon: FileText },
  ],
  [UserRole.TECHNICIAN]: [
    { name: 'My Assignments', href: '/tech', icon: LayoutDashboard },
    { name: 'Equipment', href: '/tech/equipment', icon: Wrench },
    { name: 'Parts', href: '/tech/parts', icon: Settings },
    { name: 'Submit', href: '/tech/submit', icon: CheckSquare },
  ],
  [UserRole.HSE]: [
    { name: 'Dashboard', href: '/hse', icon: LayoutDashboard },
    { name: 'Safety Equipment', href: '/hse/equipment', icon: Shield },
    { name: 'Certificates', href: '/hse/certificates', icon: FileText },
    { name: 'Emergency', href: '/hse/emergency', icon: Users },
  ],
};

export function Sidebar() {
  const { user } = useAuth();
  const userNavigation = user?.role ? navigation[user.role] || [] : [];

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 bg-gray-800">
        <img 
          src="/images/sms-logo.svg" 
          alt="SMS - Smart Maintenance System" 
          className="h-10 w-auto brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {userNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-400">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}