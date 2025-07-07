import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiGrid, 
  FiCalendar, 
  FiFileText, 
  FiPackage, 
  FiUsers, 
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiLogOut
} from 'react-icons/fi';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/oceanic');
  };

  // Stats data
  const stats = {
    activeFaults: { critical: 2, minor: 8, resolved: 45 },
    maintenance: { scheduled: 12, overdue: 3, completed: 156 },
    inventory: { lowStock: 7, pendingOrders: 4, totalValue: 285000 },
    performance: { mttr: 3.2, uptime: 98.5, efficiency: 94.2 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">Manager Dashboard</h1>
              <p className="text-sm text-gray-400">{user?.firstName} {user?.lastName} • Fleet Manager</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600/20 border border-gray-600 hover:border-red-500/30 rounded-lg transition-all"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{stats.performance.uptime}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Equipment Uptime</h3>
            <p className="text-xs text-green-400 mt-1">↑ 2.3% from last month</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold text-white">{stats.performance.mttr}h</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Avg MTTR</h3>
            <p className="text-xs text-amber-400 mt-1">Mean Time To Repair</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-2xl font-bold text-white">{stats.activeFaults.critical}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Critical Faults</h3>
            <p className="text-xs text-gray-500 mt-1">{stats.activeFaults.minor} minor active</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-8 h-8 text-sms-cyan" />
              <span className="text-xl font-bold text-white">${(stats.inventory.totalValue / 1000).toFixed(0)}k</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Inventory Value</h3>
            <p className="text-xs text-red-400 mt-1">{stats.inventory.lowStock} items low</p>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Equipment Management */}
          <div 
            onClick={() => navigate('/equipment/management')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02]"
          >
            <FiGrid className="w-10 h-10 text-sms-cyan mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Equipment Management</h3>
            <p className="text-gray-400 text-sm mb-4">Fleet equipment overview</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">All Departments</span>
              <span className="text-xs text-green-400">{stats.maintenance.scheduled} Scheduled</span>
            </div>
          </div>

          {/* Maintenance Calendar */}
          <div 
            onClick={() => navigate('/maintenance')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-blue-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]"
          >
            <FiCalendar className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Maintenance Calendar</h3>
            <p className="text-gray-400 text-sm mb-4">PM schedule & tracking</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">This Month: {stats.maintenance.scheduled}</span>
              <span className="text-xs text-red-400">{stats.maintenance.overdue} Overdue</span>
            </div>
          </div>

          {/* Inventory */}
          <div 
            onClick={() => navigate('/inventory')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-orange-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 hover:scale-[1.02]"
          >
            <FiPackage className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Inventory Management</h3>
            <p className="text-gray-400 text-sm mb-4">Parts & stock control</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{stats.inventory.pendingOrders} Orders</span>
              <span className="text-xs text-red-400">{stats.inventory.lowStock} Low Stock</span>
            </div>
          </div>

          {/* Records */}
          <div 
            onClick={() => navigate('/records')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]"
          >
            <FiFileText className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Records & Reports</h3>
            <p className="text-gray-400 text-sm mb-4">Historical data & analytics</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">All Time</span>
              <span className="text-xs text-gray-400">Export Ready</span>
            </div>
          </div>

          {/* Team Management */}
          <div 
            onClick={() => navigate('/team')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-green-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02]"
          >
            <FiUsers className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
            <p className="text-gray-400 text-sm mb-4">Technician performance</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">24 Active</span>
              <span className="text-xs text-green-400">4 On Rotation</span>
            </div>
          </div>

          {/* Analytics */}
          <div 
            onClick={() => navigate('/analytics')}
            className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02]"
          >
            <FiTrendingUp className="w-10 h-10 text-sms-cyan mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
            <p className="text-gray-400 text-sm mb-4">Performance metrics</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Real-time</span>
              <span className="text-xs text-green-400">↑ 94.2% Efficiency</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiAlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-white">Critical Fault: Top Drive VFD</p>
                  <p className="text-xs text-gray-400">Reported by John Smith • 2 hours ago</p>
                </div>
              </div>
              <span className="text-xs text-red-400">In Progress</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiPackage className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm text-white">Low Stock Alert: Control Relay CR-2745</p>
                  <p className="text-xs text-gray-400">3 units remaining • Reorder initiated</p>
                </div>
              </div>
              <span className="text-xs text-amber-400">Pending</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-white">PM Completed: Generator 2</p>
                  <p className="text-xs text-gray-400">By Mike Chen • 4 hours ago</p>
                </div>
              </div>
              <span className="text-xs text-green-400">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;