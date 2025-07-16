import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  FiTrendingUp,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiClock,
  FiAlertCircle,
  FiTool,
  FiDollarSign,
  FiChevronDown,
  FiLoader,
  FiRefreshCw,
  FiArrowLeft
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import SMSFooter from '../components/SMSFooter';
import { CardSkeleton, ChartSkeleton } from '../components/ui/SkeletonLoader';
import { NoDataState } from '../components/ui/EmptyState';
import { showError } from '../utils/toast';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<string>('all');
  const [dateRange, setDateRange] = useState(30); // days
  const [fleetData, setFleetData] = useState<any>(null);
  const [vesselTrends, setVesselTrends] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);

  useEffect(() => {
    fetchVessels();
    fetchAnalytics();
  }, [selectedVessel, dateRange]);

  const fetchVessels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/vessels`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVessels(response.data);
    } catch (error) {
      console.error('Error fetching vessels:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch fleet analytics
      const fleetResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/analytics/fleet`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFleetData(fleetResponse.data);

      // Fetch vessel trends if a specific vessel is selected
      if (selectedVessel !== 'all') {
        const trendsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/analytics/trends/vessel/${selectedVessel}/equipment_uptime?days=${dateRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVesselTrends(trendsResponse.data.trends);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchAnalytics();
  };

  // Prepare chart data
  const prepareUptimeChartData = () => {
    if (!fleetData?.vessels) return [];
    return fleetData.vessels.map((vessel: any) => ({
      name: vessel.name,
      uptime: vessel.equipment_uptime_percentage || 0,
      target: 95 // Target uptime
    }));
  };

  const prepareFaultDistribution = () => {
    if (!fleetData?.faultStats) return [];
    const stats = fleetData.faultStats;
    return [
      { name: 'Critical', value: stats.critical_faults || 0, color: '#dc2626' },
      { name: 'High', value: stats.high_faults || 0, color: '#f97316' },
      { name: 'Medium', value: stats.medium_faults || 0, color: '#eab308' },
      { name: 'Low', value: stats.low_faults || 0, color: '#3b82f6' }
    ];
  };

  const prepareTrendData = () => {
    if (!vesselTrends || vesselTrends.length === 0) return [];
    return vesselTrends.map((trend: any) => ({
      date: format(new Date(trend.period), 'MMM d'),
      value: trend.avg_value || 0
    }));
  };

  const COLORS = ['#dc2626', '#f97316', '#eab308', '#3b82f6'];

  if (loading && !fleetData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center">
        <FiLoader className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Performance Analytics</h1>
                <p className="text-sm text-gray-400">Fleet performance metrics and trends</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Vessel Filter */}
              <select
                value={selectedVessel}
                onChange={(e) => setSelectedVessel(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-sms-cyan"
              >
                <option value="all">All Vessels</option>
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name}
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value))}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-sms-cyan"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={loading}
                className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading && !fleetData ? (
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
              <FiActivity className="w-8 h-8 text-status-good" />
              <span className="text-2xl font-bold text-white">
                {fleetData?.fleet?.avg_fleet_uptime?.toFixed(1) || '0'}%
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Fleet Uptime</h3>
            <p className="text-xs text-gray-500 mt-1">Average across all vessels</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-8 h-8 text-status-warning" />
              <span className="text-2xl font-bold text-white">
                {fleetData?.fleet?.avg_fleet_mttr?.toFixed(1) || '0'}h
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Avg MTTR</h3>
            <p className="text-xs text-gray-500 mt-1">Mean Time To Repair</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-8 h-8 text-status-critical" />
              <span className="text-2xl font-bold text-white">
                {fleetData?.fleet?.total_fleet_faults || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Active Faults</h3>
            <p className="text-xs text-status-critical mt-1">
              {fleetData?.fleet?.total_critical_faults || 0} critical
            </p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-8 h-8 text-sms-cyan" />
              <span className="text-xl font-bold text-white">
                ${((fleetData?.fleet?.total_fleet_cost || 0) / 1000).toFixed(0)}k
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Monthly Cost</h3>
            <p className="text-xs text-gray-500 mt-1">Maintenance & parts</p>
          </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !fleetData ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : !fleetData?.vessels || fleetData.vessels.length === 0 ? (
            <div className="lg:col-span-2">
              <NoDataState message="No fleet data available" />
            </div>
          ) : (
            <>
          {/* Vessel Uptime Comparison */}
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Vessel Uptime Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareUptimeChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="uptime" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#374151" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fault Distribution */}
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Fault Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareFaultDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareFaultDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Chart (if vessel selected) */}
          {selectedVessel !== 'all' && vesselTrends.length > 0 && (
            <div className="bg-sms-dark border border-gray-700 rounded-xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                Uptime Trend - {vessels.find(v => v.id.toString() === selectedVessel)?.name}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
            </>
          )}
        </div>

        {/* Vessel Performance Table */}
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Vessel Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Vessel</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Uptime</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">MTTR</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Compliance</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Active Faults</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                {fleetData?.vessels?.map((vessel: any) => (
                  <tr key={vessel.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedVessel(vessel.id.toString())}
                        className="text-sm font-medium text-white hover:text-sms-cyan transition-colors"
                      >
                        {vessel.name}
                      </button>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-sm font-semibold ${
                        vessel.equipment_uptime_percentage >= 95 ? 'text-status-good' :
                        vessel.equipment_uptime_percentage >= 90 ? 'text-status-warning' : 'text-status-critical'
                      }`}>
                        {vessel.equipment_uptime_percentage?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-sm text-white">
                        {vessel.avg_mttr_hours?.toFixed(1) || '0'}h
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-sm font-semibold ${
                        vessel.maintenance_compliance_rate >= 90 ? 'text-status-good' :
                        vessel.maintenance_compliance_rate >= 70 ? 'text-status-warning' : 'text-status-critical'
                      }`}>
                        {vessel.maintenance_compliance_rate?.toFixed(0) || '0'}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-sm text-white">
                        {vessel.total_faults_reported || 0}
                        {vessel.critical_faults > 0 && (
                          <span className="text-status-critical ml-1">({vessel.critical_faults})</span>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-sm text-white">
                        ${((vessel.total_cost || 0) / 1000).toFixed(1)}k
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SMSFooter className="mt-8" />
      </div>
    </div>
  );
};

export default Analytics;