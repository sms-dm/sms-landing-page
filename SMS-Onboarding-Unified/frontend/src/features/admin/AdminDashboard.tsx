import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  CompanySetupWizard,
  DepartmentManagement,
  ManagerAssignment,
  TeamStructureBuilder,
  UserManagement,
  VesselSetup
} from './components';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Network, 
  Ship, 
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const navItems: NavItem[] = [
  {
    id: 'company',
    label: 'Company Setup',
    icon: Building2,
    component: CompanySetupWizard
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: LayoutDashboard,
    component: DepartmentManagement
  },
  {
    id: 'managers',
    label: 'Manager Assignment',
    icon: UserCheck,
    component: ManagerAssignment
  },
  {
    id: 'teams',
    label: 'Team Structure',
    icon: Network,
    component: TeamStructureBuilder
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    component: UserManagement
  },
  {
    id: 'vessels',
    label: 'Vessel Setup',
    icon: Ship,
    component: VesselSetup
  }
];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeSection, setActiveSection] = useState('company');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const ActiveComponent = navItems.find(item => item.id === activeSection)?.component || CompanySetupWizard;

  const handleLogout = () => {
    // Handle logout logic
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-lg transition-all duration-300 hidden lg:block`}>
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${!isSidebarOpen && 'justify-center'}`}>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Ship className="h-6 w-6 text-white" />
                </div>
                {isSidebarOpen && (
                  <span className="ml-3 text-xl font-bold text-gray-900">SMS Admin</span>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 hover:bg-gray-100 rounded lg:block hidden"
              >
                <ChevronRight className={`h-5 w-5 text-gray-500 transition-transform ${
                  !isSidebarOpen ? 'rotate-0' : 'rotate-180'
                }`} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${!isSidebarOpen && 'mx-auto'}`} />
                      {isSidebarOpen && (
                        <span className="ml-3 font-medium">{item.label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            {isSidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <LogOut className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full p-2 hover:bg-gray-100 rounded flex justify-center"
              >
                <LogOut className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="h-full flex flex-col">
              {/* Logo/Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Ship className="h-6 w-6 text-white" />
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-900">SMS Admin</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="ml-3 font-medium">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* User Section */}
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <LogOut className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find(item => item.id === activeSection)?.label}
          </h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Component Content */}
        <div className="h-full overflow-y-auto">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};