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
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-sms-dark/80 backdrop-blur-sm border-r border-gray-700 transition-all duration-300 hidden lg:block`}>
          <div className="h-full flex flex-col">
            {/* Logo/Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${!isSidebarOpen && 'justify-center'}`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-sms-cyan to-sms-blue rounded-lg flex items-center justify-center">
                    <Ship className="h-6 w-6 text-white" />
                  </div>
                  {isSidebarOpen && (
                    <span className="ml-3 text-xl font-bold text-white">SMS Admin</span>
                  )}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 hover:bg-gray-700 rounded-lg lg:block hidden transition-all"
                >
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
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
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-sms-blue text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
            <div className="p-4 border-t border-gray-700">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-sms-cyan to-sms-blue rounded-full mr-3 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-red-600/20 hover:border-red-500/30 rounded-lg transition-all group"
                  >
                    <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full p-2 hover:bg-red-600/20 hover:border-red-500/30 rounded-lg flex justify-center transition-all group"
                >
                  <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
                </button>
              )}
            </div>
        </div>
      </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="fixed left-0 top-0 h-full w-64 bg-sms-dark/95 backdrop-blur-lg border-r border-gray-700">
              <div className="h-full flex flex-col">
                {/* Logo/Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-sms-cyan to-sms-blue rounded-lg flex items-center justify-center">
                      <Ship className="h-6 w-6 text-white" />
                    </div>
                    <span className="ml-3 text-xl font-bold text-white">SMS Admin</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5 text-gray-400" />
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
                            className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${
                              isActive 
                                ? 'bg-sms-blue text-white' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-sms-cyan to-sms-blue rounded-full mr-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{user?.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-red-600/20 hover:border-red-500/30 rounded-lg transition-all group"
                    >
                      <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
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
          <div className="lg:hidden bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all"
            >
              <Menu className="h-5 w-5 text-gray-400" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {navItems.find(item => item.id === activeSection)?.label}
            </h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>

          {/* Component Content */}
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <ActiveComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};