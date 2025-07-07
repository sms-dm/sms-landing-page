import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TeamChatWidget from '../components/TeamChatWidget';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import {
  FiLogOut, FiActivity, FiZap, FiAlertTriangle, FiTrendingUp,
  FiUsers, FiClock, FiShield, FiRefreshCw, FiAlertCircle,
  FiCheckCircle, FiTool, FiBarChart2, FiPieChart, FiGrid,
  FiBriefcase, FiAward, FiUserCheck, FiMessageCircle,
  FiHeart, FiCpu, FiFileText, FiPercent, FiTrendingDown, FiSettings
} from 'react-icons/fi';
import HSEWellbeingSection from '../components/HSEWellbeingSection';

// Mock data for vessels
const vessels = [
  { id: 'all', name: 'All Vessels' },
  { id: 'oceanic-pioneer', name: 'Oceanic Pioneer' },
  { id: 'atlantic-explorer', name: 'Atlantic Explorer' },
  { id: 'pacific-voyager', name: 'Pacific Voyager' },
  { id: 'arctic-challenger', name: 'Arctic Challenger' },
  { id: 'gulf-master', name: 'Gulf Master' }
];

// Mock MTTR trend data
const mttrTrendData = [
  { month: 'Jan', mttr: 4.2, target: 3.5 },
  { month: 'Feb', mttr: 3.8, target: 3.5 },
  { month: 'Mar', mttr: 3.5, target: 3.5 },
  { month: 'Apr', mttr: 3.2, target: 3.5 },
  { month: 'May', mttr: 2.9, target: 3.5 },
  { month: 'Jun', mttr: 3.1, target: 3.5 },
  { month: 'Jul', mttr: 2.8, target: 3.5 }
];

// Mock fault distribution data
const faultDistributionData = [
  { name: 'Power Distribution', value: 30, color: '#FF6B6B' },
  { name: 'Control Systems', value: 25, color: '#4ECDC4' },
  { name: 'Motors & Drives', value: 20, color: '#45B7D1' },
  { name: 'Lighting', value: 15, color: '#F7DC6F' },
  { name: 'Communication', value: 10, color: '#B19CD9' }
];

// Mock team performance data
const teamPerformanceData = [
  { name: 'John Smith', completed: 45, efficiency: 92 },
  { name: 'Mike Chen', completed: 42, efficiency: 89 },
  { name: 'Sarah Johnson', completed: 38, efficiency: 94 },
  { name: 'Tom Wilson', completed: 35, efficiency: 87 },
  { name: 'Lisa Anderson', completed: 33, efficiency: 91 }
];

// Mock equipment health data
const equipmentHealthData = [
  { equipment: 'Top Drive', electrical: 85, mechanical: 78, hydraulic: 82 },
  { equipment: 'Drawworks', electrical: 92, mechanical: 88, hydraulic: 90 },
  { equipment: 'Mud Pumps', electrical: 78, mechanical: 75, hydraulic: 80 },
  { equipment: 'BOP Control', electrical: 95, mechanical: 93, hydraulic: 94 },
  { equipment: 'Generators', electrical: 88, mechanical: 85, hydraulic: 0 }
];

// Mock predictive analytics data
const predictiveData = [
  { system: 'Power Distribution', riskScore: 25, predictedFailure: '12 days', severity: 'Medium' },
  { system: 'VFD Drive #3', riskScore: 68, predictedFailure: '5 days', severity: 'High' },
  { system: 'Emergency Generator', riskScore: 15, predictedFailure: '45 days', severity: 'Low' },
  { system: 'Control Panel A', riskScore: 42, predictedFailure: '18 days', severity: 'Medium' }
];

// Mock training compliance data
const trainingComplianceData = [
  { category: 'Electrical Safety', compliance: 94, target: 100 },
  { category: 'Arc Flash Training', compliance: 88, target: 100 },
  { category: 'Equipment Specific', compliance: 92, target: 100 },
  { category: 'Emergency Response', compliance: 96, target: 100 },
  { category: 'LOTO Procedures', compliance: 90, target: 100 }
];

// Mock workload distribution data
const workloadDistributionData = [
  { technician: 'John Smith', preventive: 40, corrective: 35, projects: 25 },
  { technician: 'Mike Chen', preventive: 35, corrective: 45, projects: 20 },
  { technician: 'Sarah Johnson', preventive: 45, corrective: 30, projects: 25 },
  { technician: 'Tom Wilson', preventive: 50, corrective: 25, projects: 25 },
  { technician: 'Lisa Anderson', preventive: 38, corrective: 40, projects: 22 }
];

// Mock equipment downtime analysis
const downtimeAnalysisData = [
  { month: 'Jan', electrical: 12, mechanical: 18, total: 30 },
  { month: 'Feb', electrical: 10, mechanical: 15, total: 25 },
  { month: 'Mar', electrical: 8, mechanical: 20, total: 28 },
  { month: 'Apr', electrical: 6, mechanical: 16, total: 22 },
  { month: 'May', electrical: 9, mechanical: 14, total: 23 },
  { month: 'Jun', electrical: 7, mechanical: 13, total: 20 },
  { month: 'Jul', electrical: 5, mechanical: 12, total: 17 }
];

// Mock missed maintenance data
const missedMaintenanceData = [
  { week: 'W1', missed: 2, completed: 45 },
  { week: 'W2', missed: 3, completed: 42 },
  { week: 'W3', missed: 1, completed: 48 },
  { week: 'W4', missed: 4, completed: 41 }
];

const ElectricalManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedVessel, setSelectedVessel] = useState('all');

  const handleLogout = () => {
    logout();
    navigate('/oceanic');
  };

  // Dynamic KPI data based on vessel selection
  const kpiData = useMemo(() => {
    if (selectedVessel === 'all') {
      return {
        teamPerformance: 91.5,
        avgMTTR: 2.8,
        missedMaintenance: 6.2,
        trainingCompliance: 92,
        downtimeHours: 17,
        resourceUtilization: 87
      };
    } else {
      // Vessel-specific mock data
      return {
        teamPerformance: (Math.random() * 10 + 85).toFixed(1),
        avgMTTR: (Math.random() * 2 + 2).toFixed(1),
        missedMaintenance: (Math.random() * 5 + 3).toFixed(1),
        trainingCompliance: Math.floor(Math.random() * 10 + 85),
        downtimeHours: Math.floor(Math.random() * 15 + 5),
        resourceUtilization: Math.floor(Math.random() * 15 + 75)
      };
    }
  }, [selectedVessel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header with Vessel Selector */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold text-white">Electrical Manager Dashboard</h1>
                <p className="text-sm text-gray-400">{user?.firstName} {user?.lastName} • Electrical Superintendent</p>
              </div>
              
              {/* Vessel Selector */}
              <select
                value={selectedVessel}
                onChange={(e) => setSelectedVessel(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-sms-cyan"
              >
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name}
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
        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiUsers className="w-6 h-6 text-green-400" />
              <span className="text-2xl font-bold text-white">{kpiData.teamPerformance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Team Performance</h3>
            <p className="text-xs text-green-400 mt-1">↑ 3.2% vs target</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">{kpiData.avgMTTR}h</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Avg MTTR</h3>
            <p className="text-xs text-green-400 mt-1">↓ 12% improvement</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiPercent className="w-6 h-6 text-red-400" />
              <span className="text-2xl font-bold text-white">{kpiData.missedMaintenance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Missed Maintenance</h3>
            <p className="text-xs text-red-400 mt-1">Target: &lt;5%</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiAward className="w-6 h-6 text-blue-400" />
              <span className="text-2xl font-bold text-white">{kpiData.trainingCompliance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Training Compliance</h3>
            <p className="text-xs text-gray-500 mt-1">5 sessions due</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingDown className="w-6 h-6 text-purple-400" />
              <span className="text-2xl font-bold text-white">{kpiData.downtimeHours}h</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Electrical Downtime</h3>
            <p className="text-xs text-green-400 mt-1">↓ 29% this month</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiBriefcase className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{kpiData.resourceUtilization}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Resource Utilization</h3>
            <p className="text-xs text-gray-500 mt-1">Optimal range</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MTTR Trend Chart */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiTrendingUp className="mr-2 text-sms-cyan" />
                MTTR Trend Analysis
              </h3>
              <span className="text-xs text-gray-400">Last 7 months</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mttrTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mttr" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  name="Actual MTTR"
                  dot={{ fill: '#06B6D4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Fault Distribution */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiPieChart className="mr-2 text-purple-400" />
                Fault Distribution by System
              </h3>
              <span className="text-xs text-gray-400">Current month</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={faultDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                >
                  {faultDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row - Training & Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Training Compliance */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiAward className="mr-2 text-blue-400" />
                Training Compliance Rates
              </h3>
              <span className="text-xs text-gray-400">Current quarter</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={trainingComplianceData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="category" stroke="#9CA3AF" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                <Radar 
                  name="Compliance %" 
                  dataKey="compliance" 
                  stroke="#06B6D4" 
                  fill="#06B6D4" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Target" 
                  dataKey="target" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.1} 
                  strokeDasharray="5 5"
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Workload Distribution */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiBriefcase className="mr-2 text-purple-400" />
                Team Workload Distribution
              </h3>
              <span className="text-xs text-gray-400">Current allocation</span>
            </div>
            <div className="space-y-3">
              {workloadDistributionData.map((tech, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300 font-medium">{tech.technician}</p>
                    <span className="text-xs text-gray-500">
                      {tech.preventive + tech.corrective + tech.projects} hrs/week
                    </span>
                  </div>
                  <div className="flex h-6 rounded-lg overflow-hidden bg-gray-800">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${tech.preventive}%` }}
                    >
                      {tech.preventive}%
                    </div>
                    <div 
                      className="bg-amber-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${tech.corrective}%` }}
                    >
                      {tech.corrective}%
                    </div>
                    <div 
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${tech.projects}%` }}
                    >
                      {tech.projects}%
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded mr-1"></div>Preventive</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded mr-1"></div>Corrective</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded mr-1"></div>Projects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Third Row - Downtime & Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Equipment Downtime Analysis */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiTrendingDown className="mr-2 text-red-400" />
                Equipment Downtime Analysis
              </h3>
              <span className="text-xs text-gray-400">Hours per month</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={downtimeAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="electrical" 
                  stackId="1"
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.6}
                  name="Electrical Issues"
                />
                <Area 
                  type="monotone" 
                  dataKey="mechanical" 
                  stackId="1"
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.6}
                  name="Other Issues"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Missed Maintenance Tracking */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiPercent className="mr-2 text-amber-400" />
                Maintenance Completion Rate
              </h3>
              <span className="text-xs text-gray-400">Last 4 weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={missedMaintenanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Missed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiBarChart2 className="w-8 h-8 text-sms-cyan group-hover:scale-110 transition-transform" />
              <FiTrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-white text-left">View Team Performance</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Detailed analytics & KPIs</p>
          </button>

          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiAward className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">5 Due</span>
            </div>
            <h3 className="text-sm font-semibold text-white text-left">Training Overview</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Certifications & compliance</p>
          </button>

          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-400">94%</span>
            </div>
            <h3 className="text-sm font-semibold text-white text-left">Maintenance Compliance</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Schedule adherence</p>
          </button>

          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-red-500 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiFileText className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">New</span>
            </div>
            <h3 className="text-sm font-semibold text-white text-left">Fault Analysis Reports</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Root cause analysis</p>
          </button>

          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-amber-500 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiBriefcase className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
              <FiActivity className="w-4 h-4 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-white text-left">Resource Allocation</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Optimize team deployment</p>
          </button>
        </div>

        {/* Bottom Section - Communication & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manager Community Chat */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiMessageCircle className="mr-2 text-blue-400" />
              Manager Community
            </h3>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-white">Michael Thompson</p>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-xs text-gray-400">Mechanical Manager • Atlantic Explorer</p>
                <p className="text-sm text-gray-300 mt-2">Heads up: Major bearing replacement scheduled for next week. Will need electrical support for motor alignment.</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-white">Sarah Williams</p>
                  <span className="text-xs text-gray-500">5h ago</span>
                </div>
                <p className="text-xs text-gray-400">HSE Manager • Fleet</p>
                <p className="text-sm text-gray-300 mt-2">New arc flash training requirements effective next month. Please review with your teams.</p>
              </div>
            </div>
            <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
              View All Messages
            </button>
          </div>

          {/* AI Insights & Recommendations */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiCpu className="mr-2 text-purple-400" />
              AI Insights & Recommendations
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-start">
                  <FiTrendingUp className="w-4 h-4 text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Optimize PM Schedule</p>
                    <p className="text-xs text-gray-400 mt-1">Analysis shows 23% efficiency gain possible by consolidating maintenance windows for similar equipment types.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start">
                  <FiUsers className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Team Skill Gap Identified</p>
                    <p className="text-xs text-gray-400 mt-1">VFD troubleshooting skills below fleet average. Consider specialized training for 3 team members.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-start">
                  <FiAlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Predictive Alert</p>
                    <p className="text-xs text-gray-400 mt-1">Power quality issues detected across 3 vessels. Recommend fleet-wide harmonic analysis.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HSE & Wellbeing Section */}
          <HSEWellbeingSection vesselId={selectedVessel !== 'all' ? selectedVessel : undefined} />
        </div>
      </div>
      
      {/* Team Chat Widget */}
      <TeamChatWidget defaultOpen={false} />
    </div>
  );
};

export default ElectricalManagerDashboard;