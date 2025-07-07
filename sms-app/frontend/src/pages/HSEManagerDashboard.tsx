import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TeamChatWidget from '../components/TeamChatWidget';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FiLogOut, FiShield, FiAlertTriangle, FiTrendingUp,
  FiUsers, FiClock, FiActivity, FiAlertCircle,
  FiCheckCircle, FiAward, FiCalendar, FiBarChart2,
  FiPieChart, FiGrid, FiFileText, FiTarget,
  FiTrendingDown, FiChevronRight, FiInfo, FiSettings
} from 'react-icons/fi';

// Mock data for vessels/fleet
const fleetOptions = [
  { id: 'all', name: 'All Fleet' },
  { id: 'oceanic-pioneer', name: 'Oceanic Pioneer' },
  { id: 'atlantic-explorer', name: 'Atlantic Explorer' },
  { id: 'pacific-voyager', name: 'Pacific Voyager' },
  { id: 'arctic-challenger', name: 'Arctic Challenger' },
  { id: 'gulf-master', name: 'Gulf Master' }
];

// Mock incident trend data
const incidentTrendData = [
  { month: 'Jan', incidents: 8, nearMiss: 12, firstAid: 5, lostTime: 1 },
  { month: 'Feb', incidents: 6, nearMiss: 15, firstAid: 4, lostTime: 0 },
  { month: 'Mar', incidents: 7, nearMiss: 10, firstAid: 6, lostTime: 1 },
  { month: 'Apr', incidents: 5, nearMiss: 18, firstAid: 3, lostTime: 0 },
  { month: 'May', incidents: 4, nearMiss: 20, firstAid: 2, lostTime: 0 },
  { month: 'Jun', incidents: 3, nearMiss: 22, firstAid: 2, lostTime: 0 },
  { month: 'Jul', incidents: 2, nearMiss: 25, firstAid: 1, lostTime: 0 }
];

// Mock incident types distribution
const incidentTypesData = [
  { name: 'Slips/Trips/Falls', value: 28, color: '#FF6B6B' },
  { name: 'Struck By Object', value: 22, color: '#4ECDC4' },
  { name: 'Caught Between', value: 18, color: '#45B7D1' },
  { name: 'Electrical', value: 12, color: '#F7DC6F' },
  { name: 'Chemical Exposure', value: 10, color: '#B19CD9' },
  { name: 'Other', value: 10, color: '#95A5A6' }
];

// Mock safety performance by vessel
const vesselSafetyData = [
  { vessel: 'Oceanic Pioneer', safetyScore: 92, incidents: 2, compliance: 95 },
  { vessel: 'Atlantic Explorer', safetyScore: 88, incidents: 3, compliance: 91 },
  { vessel: 'Pacific Voyager', safetyScore: 95, incidents: 1, compliance: 98 },
  { vessel: 'Arctic Challenger', safetyScore: 85, incidents: 4, compliance: 87 },
  { vessel: 'Gulf Master', safetyScore: 90, incidents: 2, compliance: 93 }
];

// Mock compliance heatmap data
const complianceHeatmapData = [
  { category: 'Safety Training', oceanic: 95, atlantic: 92, pacific: 98, arctic: 88, gulf: 94 },
  { category: 'PPE Compliance', oceanic: 98, atlantic: 96, pacific: 99, arctic: 95, gulf: 97 },
  { category: 'Permit to Work', oceanic: 93, atlantic: 91, pacific: 96, arctic: 89, gulf: 92 },
  { category: 'Drill Participation', oceanic: 96, atlantic: 94, pacific: 97, arctic: 92, gulf: 95 },
  { category: 'Documentation', oceanic: 91, atlantic: 89, pacific: 94, arctic: 86, gulf: 90 },
  { category: 'Audit Actions', oceanic: 88, atlantic: 85, pacific: 92, arctic: 83, gulf: 87 }
];

// Mock HSE officers data
const hseOfficersData = [
  { name: 'John Martinez', vessel: 'Oceanic Pioneer', status: 'On Duty', reports: 12, lastInspection: '2 hours ago' },
  { name: 'Sarah Chen', vessel: 'Atlantic Explorer', status: 'On Duty', reports: 8, lastInspection: '4 hours ago' },
  { name: 'Mike Johnson', vessel: 'Pacific Voyager', status: 'Off Duty', reports: 15, lastInspection: '1 day ago' },
  { name: 'Lisa Anderson', vessel: 'Arctic Challenger', status: 'On Duty', reports: 10, lastInspection: '6 hours ago' },
  { name: 'Tom Wilson', vessel: 'Gulf Master', status: 'On Leave', reports: 5, lastInspection: '3 days ago' }
];

// Mock critical safety alerts
const criticalAlertsData = [
  { id: 1, type: 'critical', title: 'H2S Detector Malfunction', vessel: 'Arctic Challenger', time: '2 hours ago', status: 'active' },
  { id: 2, type: 'warning', title: 'Expired Fire Extinguishers (3)', vessel: 'Atlantic Explorer', time: '5 hours ago', status: 'pending' },
  { id: 3, type: 'critical', title: 'Safety Harness Inspection Overdue', vessel: 'Oceanic Pioneer', time: '1 day ago', status: 'active' },
  { id: 4, type: 'info', title: 'Weekly Safety Meeting Scheduled', vessel: 'All Vessels', time: 'Tomorrow 09:00', status: 'scheduled' }
];

// Mock upcoming audits and certifications
const upcomingAuditsData = [
  { id: 1, type: 'audit', title: 'ISM External Audit', vessel: 'Oceanic Pioneer', date: '2025-01-15', priority: 'high' },
  { id: 2, type: 'certification', title: 'SOLAS Certificate Renewal', vessel: 'Atlantic Explorer', date: '2025-01-22', priority: 'high' },
  { id: 3, type: 'inspection', title: 'Flag State Inspection', vessel: 'Pacific Voyager', date: '2025-01-18', priority: 'medium' },
  { id: 4, type: 'audit', title: 'Internal Safety Audit', vessel: 'All Vessels', date: '2025-01-25', priority: 'medium' },
  { id: 5, type: 'certification', title: 'MARPOL Certificate', vessel: 'Arctic Challenger', date: '2025-02-01', priority: 'low' }
];

const HSEManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFleet, setSelectedFleet] = useState('all');

  const handleLogout = () => {
    logout();
    navigate('/oceanic');
  };

  // Dynamic KPI data based on fleet selection
  const kpiData = useMemo(() => {
    if (selectedFleet === 'all') {
      return {
        totalIncidents: 12,
        trir: 1.8,
        nearMissRate: 25,
        trainingCompliance: 94,
        daysWithoutIncident: 47,
        auditScore: 91
      };
    } else {
      // Vessel-specific mock data
      return {
        totalIncidents: Math.floor(Math.random() * 5) + 1,
        trir: (Math.random() * 2 + 0.5).toFixed(1),
        nearMissRate: Math.floor(Math.random() * 20) + 10,
        trainingCompliance: Math.floor(Math.random() * 10) + 85,
        daysWithoutIncident: Math.floor(Math.random() * 100) + 20,
        auditScore: Math.floor(Math.random() * 10) + 85
      };
    }
  }, [selectedFleet]);

  const getComplianceColor = (value: number) => {
    if (value >= 95) return 'bg-green-500/20 text-green-400';
    if (value >= 85) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <FiAlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <FiAlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info': return <FiInfo className="w-4 h-4 text-blue-400" />;
      default: return <FiCheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-900/20';
      case 'medium': return 'border-amber-500/30 bg-amber-900/20';
      case 'low': return 'border-green-500/30 bg-green-900/20';
      default: return 'border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header with Fleet Selector */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold text-white">HSE Manager Dashboard</h1>
                <p className="text-sm text-gray-400">{user?.firstName} {user?.lastName} • Health, Safety & Environment Manager</p>
              </div>
              
              {/* Fleet Selector */}
              <select
                value={selectedFleet}
                onChange={(e) => setSelectedFleet(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-sms-cyan"
              >
                {fleetOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
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
        {/* Safety KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-6 h-6 text-red-400" />
              <span className="text-2xl font-bold text-white">{kpiData.totalIncidents}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Total Incidents</h3>
            <p className="text-xs text-red-400 mt-1">↑ 2 vs last month</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiActivity className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">{kpiData.trir}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">TRIR</h3>
            <p className="text-xs text-green-400 mt-1">↓ 0.3 improvement</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiAlertTriangle className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{kpiData.nearMissRate}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Near Miss Rate</h3>
            <p className="text-xs text-green-400 mt-1">↑ Good reporting</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiAward className="w-6 h-6 text-purple-400" />
              <span className="text-2xl font-bold text-white">{kpiData.trainingCompliance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Training Compliance</h3>
            <p className="text-xs text-gray-500 mt-1">Target: 95%</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-6 h-6 text-green-400" />
              <span className="text-2xl font-bold text-white">{kpiData.daysWithoutIncident}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Days Without Incident</h3>
            <p className="text-xs text-green-400 mt-1">Record: 125 days</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="w-6 h-6 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{kpiData.auditScore}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Audit Score</h3>
            <p className="text-xs text-gray-500 mt-1">Last audit: Jan 2025</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Incident Trends Chart */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiTrendingUp className="mr-2 text-sms-cyan" />
                Incident Trends
              </h3>
              <span className="text-xs text-gray-400">Last 7 months</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={incidentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} name="Total Incidents" />
                <Line type="monotone" dataKey="nearMiss" stroke="#F59E0B" strokeWidth={2} name="Near Miss" />
                <Line type="monotone" dataKey="firstAid" stroke="#3B82F6" strokeWidth={2} name="First Aid" />
                <Line type="monotone" dataKey="lostTime" stroke="#8B5CF6" strokeWidth={2} name="Lost Time" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Incident Types Distribution */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiPieChart className="mr-2 text-purple-400" />
                Incident Types Distribution
              </h3>
              <span className="text-xs text-gray-400">YTD 2025</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incidentTypesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                >
                  {incidentTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Safety Performance by Vessel */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiBarChart2 className="mr-2 text-green-400" />
                Safety Performance by Vessel
              </h3>
              <span className="text-xs text-gray-400">Current month</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vesselSafetyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="vessel" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="safetyScore" fill="#10B981" name="Safety Score" />
                <Bar dataKey="compliance" fill="#3B82F6" name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Compliance Heatmap */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiGrid className="mr-2 text-amber-400" />
                Compliance Heatmap
              </h3>
              <span className="text-xs text-gray-400">By category</span>
            </div>
            <div className="space-y-3">
              {complianceHeatmapData.map((category, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm text-gray-300 font-medium">{category.category}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { name: 'Oceanic', value: category.oceanic },
                      { name: 'Atlantic', value: category.atlantic },
                      { name: 'Pacific', value: category.pacific },
                      { name: 'Arctic', value: category.arctic },
                      { name: 'Gulf', value: category.gulf }
                    ].map((vessel, idx) => (
                      <div
                        key={idx}
                        className={`h-8 rounded flex items-center justify-center text-xs font-medium ${getComplianceColor(vessel.value)}`}
                        title={`${vessel.name}: ${vessel.value}%`}
                      >
                        {vessel.value}%
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* HSE Officer Overview */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiUsers className="mr-2 text-blue-400" />
              HSE Officer Overview
            </h3>
            <div className="space-y-3">
              {hseOfficersData.map((officer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{officer.name}</p>
                    <p className="text-xs text-gray-400">{officer.vessel} • {officer.reports} reports</p>
                    <p className="text-xs text-gray-500">Last inspection: {officer.lastInspection}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    officer.status === 'On Duty' ? 'bg-green-500/20 text-green-400' :
                    officer.status === 'Off Duty' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {officer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Safety Alerts */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiShield className="mr-2 text-red-400" />
              Critical Safety Alerts
            </h3>
            <div className="space-y-3">
              {criticalAlertsData.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-900/20 border-red-500/30' :
                  alert.type === 'warning' ? 'bg-amber-900/20 border-amber-500/30' :
                  'bg-blue-900/20 border-blue-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                        <p className="text-xs text-gray-400">{alert.vessel} • {alert.time}</p>
                      </div>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Audits & Certifications */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiCalendar className="mr-2 text-purple-400" />
              Upcoming Audits & Certifications
            </h3>
            <div className="space-y-3">
              {upcomingAuditsData.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all hover:scale-[1.01] cursor-pointer ${getPriorityColor(item.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.type === 'audit' && <FiFileText className="w-4 h-4 text-blue-400" />}
                        {item.type === 'certification' && <FiAward className="w-4 h-4 text-amber-400" />}
                        {item.type === 'inspection' && <FiCheckCircle className="w-4 h-4 text-green-400" />}
                        <p className="text-sm font-medium text-white">{item.title}</p>
                      </div>
                      <p className="text-xs text-gray-400">{item.vessel}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      item.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/hse/incident-report')}
            className="bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-xl p-4 transition-all duration-300 hover:scale-105"
          >
            <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Incident Reports</p>
          </button>

          <button
            onClick={() => navigate('/hse/safety-inspection')}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/30 rounded-xl p-4 transition-all duration-300 hover:scale-105"
          >
            <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Safety Inspections</p>
          </button>

          <button
            onClick={() => navigate('/hse/training-matrix')}
            className="bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 transition-all duration-300 hover:scale-105"
          >
            <FiAward className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Training Matrix</p>
          </button>

          <button
            onClick={() => navigate('/hse/analytics')}
            className="bg-cyan-900/20 hover:bg-cyan-900/30 border border-cyan-500/30 rounded-xl p-4 transition-all duration-300 hover:scale-105"
          >
            <FiTarget className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">HSE Analytics</p>
          </button>
        </div>
      </div>
      
      {/* Team Chat Widget */}
      <TeamChatWidget defaultOpen={false} />
    </div>
  );
};

export default HSEManagerDashboard;