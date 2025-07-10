import React, { useState, useEffect } from 'react';
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
  FiLogOut,
  FiSettings,
  FiLoader,
  FiArrowRightCircle
} from 'react-icons/fi';
import SMSFooter from '../components/SMSFooter';
import TeamChatWidget from '../components/TeamChatWidget';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { showError } from '../utils/toast';
import axios from 'axios';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeFaults: { critical: 0, minor: 0, resolved: 0 },
    maintenance: { scheduled: 0, overdue: 0, completed: 0 },
    inventory: { lowStock: 0, pendingOrders: 0, totalValue: 0 },
    performance: { mttr: 0, uptime: 0, efficiency: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/oceanic');
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/analytics/dashboard/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showError('Failed to load dashboard statistics');
      // Keep default values if API fails
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch recent faults
      const faultsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/faults?limit=5&sort=recent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch recent inventory alerts
      const inventoryResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/inventory/alerts?limit=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Combine and sort by date
      const activities = [
        ...faultsResponse.data.faults.map((fault: any) => ({
          type: 'fault',
          severity: fault.severity,
          title: fault.title,
          equipment: fault.equipment?.name,
          reporter: fault.reportedBy,
          date: fault.reportedDate,
          status: fault.status
        })),
        ...inventoryResponse.data.alerts.map((alert: any) => ({
          type: 'inventory',
          severity: 'warning',
          title: `Low Stock Alert: ${alert.itemName}`,
          details: `${alert.quantity} units remaining`,
          date: alert.createdAt,
          status: alert.orderStatus
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = 'http://localhost:3001/dashboard'}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-sms-cyan/20 border border-gray-600 hover:border-sms-cyan/30 rounded-lg transition-all"
              >
                <FiArrowRightCircle className="w-4 h-4" />
                <span className="text-sm">Onboarding Portal</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-blue-600/20 border border-gray-600 hover:border-blue-500/30 rounded-lg transition-all"
              >
                <FiSettings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
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
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {loading && !stats.performance.uptime ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingUp className="w-8 h-8 text-status-good" />
              {loading ? (
                <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stats.performance.uptime > 0 ? `${stats.performance.uptime.toFixed(1)}%` : 'N/A'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Equipment Uptime</h3>
            <p className="text-xs text-gray-500 mt-1">
              {stats.performance.uptime > 0 ? 'Fleet average' : 'No data available'}
            </p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-8 h-8 text-status-warning" />
              {loading ? (
                <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stats.performance.mttr > 0 ? `${stats.performance.mttr.toFixed(1)}h` : 'N/A'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Avg MTTR</h3>
            <p className="text-xs text-amber-400 mt-1">Mean Time To Repair</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-8 h-8 text-status-critical" />
              {loading ? (
                <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <span className="text-2xl font-bold text-white">{stats.activeFaults.critical}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Critical Faults</h3>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeFaults.minor > 0 ? `${stats.activeFaults.minor} minor active` : 'No minor faults'}
            </p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-8 h-8 text-sms-cyan" />
              {loading ? (
                <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <span className="text-xl font-bold text-white">
                  ${stats.inventory.totalValue > 0 ? `${(stats.inventory.totalValue / 1000).toFixed(0)}k` : '0'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Inventory Value</h3>
            <p className="text-xs text-red-400 mt-1">
              {stats.inventory.lowStock > 0 ? `${stats.inventory.lowStock} items low` : 'Stock levels OK'}
            </p>
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
              <span className="text-xs text-status-good">{stats.maintenance.scheduled} Scheduled</span>
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
              <span className="text-xs text-status-critical">{stats.maintenance.overdue} Overdue</span>
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
              <span className="text-xs text-status-critical">{stats.inventory.lowStock} Low Stock</span>
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
              <span className="text-xs text-status-good">4 On Rotation</span>
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
              <span className="text-xs text-status-good">↑ 94.2% Efficiency</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FiLoader className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const getSeverityColor = (severity: string) => {
                  switch (severity) {
                    case 'critical': return 'status-critical';
                    case 'high': return 'severity-high';
                    case 'warning': return 'status-warning';
                    case 'low': return 'severity-low';
                    default: return 'gray-400';
                  }
                };
                
                const color = getSeverityColor(activity.severity);
                const icon = activity.type === 'fault' ? FiAlertCircle : FiPackage;
                const Icon = icon;
                
                const getTimeAgo = (date: string) => {
                  const now = new Date();
                  const then = new Date(date);
                  const diff = now.getTime() - then.getTime();
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const days = Math.floor(hours / 24);
                  
                  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                  return 'Just now';
                };
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'open':
                    case 'in_progress': return 'status-warning';
                    case 'resolved':
                    case 'completed': return 'status-good';
                    case 'pending': return 'status-info';
                    default: return 'gray-400';
                  }
                };
                
                const statusColor = getStatusColor(activity.status);
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors`}>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 text-${color}`} />
                      <div>
                        <p className="text-sm text-white">{activity.title}</p>
                        <p className="text-xs text-gray-400">
                          {activity.type === 'fault' ? (
                            `${activity.equipment} • ${activity.reporter?.firstName || 'Unknown'} • ${getTimeAgo(activity.date)}`
                          ) : (
                            `${activity.details} • ${getTimeAgo(activity.date)}`
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs text-${statusColor} capitalize`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Recent Activity"
              description="Activity from faults and inventory will appear here"
              icon="inbox"
            />
          )}
        </div>
        
        {/* SMS Footer */}
        <SMSFooter className="mt-8" />
      </div>
      
      {/* Team Chat Widget */}
      <TeamChatWidget defaultOpen={false} />
    </div>
  );
};

export default ManagerDashboard;