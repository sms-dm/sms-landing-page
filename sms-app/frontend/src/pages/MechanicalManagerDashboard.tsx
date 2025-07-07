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
  FiLogOut, FiActivity, FiThermometer, FiAlertTriangle, FiTrendingUp,
  FiUsers, FiClock, FiShield, FiRefreshCw, FiAlertCircle,
  FiCheckCircle, FiTool, FiBarChart2, FiPieChart, FiGrid,
  FiDroplet, FiSettings, FiWind, FiBriefcase, FiAward,
  FiUserCheck, FiMessageCircle, FiHeart, FiCpu, FiFileText,
  FiPercent, FiTrendingDown
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

// Mock vibration trend data
const vibrationTrendData = [
  { month: 'Jan', vibration: 2.8, threshold: 4.5 },
  { month: 'Feb', vibration: 3.2, threshold: 4.5 },
  { month: 'Mar', vibration: 3.5, threshold: 4.5 },
  { month: 'Apr', vibration: 2.9, threshold: 4.5 },
  { month: 'May', vibration: 3.1, threshold: 4.5 },
  { month: 'Jun', vibration: 3.8, threshold: 4.5 },
  { month: 'Jul', vibration: 3.3, threshold: 4.5 }
];

// Mock equipment runtime data
const equipmentRuntimeData = [
  { equipment: 'Main Engine #1', hours: 2450, target: 3000 },
  { equipment: 'Main Engine #2', hours: 2380, target: 3000 },
  { equipment: 'Aux Generator #1', hours: 1850, target: 2000 },
  { equipment: 'Aux Generator #2', hours: 1920, target: 2000 },
  { equipment: 'Air Compressor', hours: 890, target: 1000 }
];

// Mock fuel consumption trend data
const fuelConsumptionData = [
  { date: '01', actual: 850, baseline: 900 },
  { date: '05', actual: 820, baseline: 900 },
  { date: '10', actual: 880, baseline: 900 },
  { date: '15', actual: 910, baseline: 900 },
  { date: '20', actual: 870, baseline: 900 },
  { date: '25', actual: 840, baseline: 900 },
  { date: '30', actual: 830, baseline: 900 }
];

// Mock mechanical fault distribution data
const mechanicalFaultData = [
  { name: 'Bearings', value: 28, color: '#FF6B6B' },
  { name: 'Seals & Gaskets', value: 22, color: '#4ECDC4' },
  { name: 'Pumps', value: 18, color: '#45B7D1' },
  { name: 'Valves', value: 15, color: '#F7DC6F' },
  { name: 'Heat Exchangers', value: 10, color: '#B19CD9' },
  { name: 'Others', value: 7, color: '#95A5A6' }
];

// Mock team performance data
const mechanicsPerformanceData = [
  { name: 'David Lee', completed: 52, efficiency: 94 },
  { name: 'James Rodriguez', completed: 48, efficiency: 91 },
  { name: 'Maria Garcia', completed: 45, efficiency: 93 },
  { name: 'Robert Taylor', completed: 42, efficiency: 88 },
  { name: 'Emily Brown', completed: 40, efficiency: 90 }
];

// Mock oil analysis results
const oilAnalysisData = [
  { equipment: 'Main Engine #1', viscosity: 92, particles: 85, water: 98, overall: 92 },
  { equipment: 'Main Engine #2', viscosity: 88, particles: 82, water: 95, overall: 88 },
  { equipment: 'Gearbox', viscosity: 85, particles: 78, water: 92, overall: 85 },
  { equipment: 'Hydraulic System', viscosity: 94, particles: 90, water: 96, overall: 93 },
  { equipment: 'Compressor', viscosity: 90, particles: 88, water: 94, overall: 91 }
];

// Mock predictive analytics data for mechanical systems
const predictiveMechanicalData = [
  { system: 'Main Bearing #3', riskScore: 72, predictedFailure: '8 days', severity: 'High' },
  { system: 'Fuel Injection Pump', riskScore: 35, predictedFailure: '21 days', severity: 'Medium' },
  { system: 'Turbocharger', riskScore: 18, predictedFailure: '60 days', severity: 'Low' },
  { system: 'Cooling Water Pump', riskScore: 45, predictedFailure: '15 days', severity: 'Medium' }
];

// Mock training compliance data for mechanical team
const mechanicalTrainingData = [
  { category: 'Hydraulic Safety', compliance: 91, target: 100 },
  { category: 'Rotating Equipment', compliance: 87, target: 100 },
  { category: 'Lubrication Systems', compliance: 94, target: 100 },
  { category: 'Vibration Analysis', compliance: 85, target: 100 },
  { category: 'Confined Space', compliance: 96, target: 100 }
];

// Mock workload distribution for mechanics
const mechanicsWorkloadData = [
  { mechanic: 'David Lee', preventive: 45, corrective: 30, projects: 25 },
  { mechanic: 'James Rodriguez', preventive: 40, corrective: 40, projects: 20 },
  { mechanic: 'Maria Garcia', preventive: 35, corrective: 35, projects: 30 },
  { mechanic: 'Robert Taylor', preventive: 50, corrective: 30, projects: 20 },
  { mechanic: 'Emily Brown', preventive: 42, corrective: 33, projects: 25 }
];

// Mock equipment reliability trends
const reliabilityTrendData = [
  { month: 'Jan', reliability: 94.2, target: 95 },
  { month: 'Feb', reliability: 93.8, target: 95 },
  { month: 'Mar', reliability: 94.5, target: 95 },
  { month: 'Apr', reliability: 95.2, target: 95 },
  { month: 'May', reliability: 95.8, target: 95 },
  { month: 'Jun', reliability: 96.1, target: 95 },
  { month: 'Jul', reliability: 96.4, target: 95 }
];

// Mock maintenance backlog data
const maintenanceBacklogData = [
  { week: 'W1', overdue: 5, dueSoon: 12, onSchedule: 83 },
  { week: 'W2', overdue: 3, dueSoon: 15, onSchedule: 82 },
  { week: 'W3', overdue: 4, dueSoon: 10, onSchedule: 86 },
  { week: 'W4', overdue: 2, dueSoon: 14, onSchedule: 84 }
];

const MechanicalManagerDashboard: React.FC = () => {
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
        teamPerformance: 89.3,
        avgMTTR: 3.2,
        missedMaintenance: 4.8,
        trainingCompliance: 90,
        equipmentReliability: 96.4,
        resourceUtilization: 82
      };
    } else {
      // Vessel-specific mock data
      return {
        teamPerformance: (Math.random() * 10 + 82).toFixed(1),
        avgMTTR: (Math.random() * 2 + 2.5).toFixed(1),
        missedMaintenance: (Math.random() * 4 + 3).toFixed(1),
        trainingCompliance: Math.floor(Math.random() * 12 + 83),
        equipmentReliability: (Math.random() * 3 + 94).toFixed(1),
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
                <h1 className="text-xl font-bold text-white">Mechanical Manager Dashboard</h1>
                <p className="text-sm text-gray-400">{user?.firstName} {user?.lastName} • Mechanical Superintendent</p>
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
            <p className="text-xs text-green-400 mt-1">↑ 2.8% vs target</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">{kpiData.avgMTTR}h</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Avg MTTR</h3>
            <p className="text-xs text-amber-400 mt-1">↑ 8% vs last month</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiPercent className="w-6 h-6 text-red-400" />
              <span className="text-2xl font-bold text-white">{kpiData.missedMaintenance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Missed Maintenance</h3>
            <p className="text-xs text-green-400 mt-1">Target: &lt;5%</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiAward className="w-6 h-6 text-blue-400" />
              <span className="text-2xl font-bold text-white">{kpiData.trainingCompliance}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Training Compliance</h3>
            <p className="text-xs text-gray-500 mt-1">8 sessions due</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiActivity className="w-6 h-6 text-purple-400" />
              <span className="text-2xl font-bold text-white">{kpiData.equipmentReliability}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Equipment Reliability</h3>
            <p className="text-xs text-green-400 mt-1">↑ 1.4% improvement</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <FiBriefcase className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{kpiData.resourceUtilization}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Resource Utilization</h3>
            <p className="text-xs text-gray-500 mt-1">28 mechanics</p>
          </div>
        </div>

        {/* Main Content Grid - MTTR and Reliability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MTTR Trend with Root Causes */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiTrendingUp className="mr-2 text-sms-cyan" />
                MTTR Trend Analysis
              </h3>
              <span className="text-xs text-gray-400">Last 7 months</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={vibrationTrendData}>
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
                  dataKey="vibration" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  name="Actual MTTR (hrs)"
                  dot={{ fill: '#06B6D4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="threshold" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target MTTR"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Equipment Reliability Trends */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiActivity className="mr-2 text-green-400" />
                Equipment Reliability Trends
              </h3>
              <span className="text-xs text-gray-400">% Uptime</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={reliabilityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[90, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="reliability" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  name="Actual Reliability"
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#6B7280" 
                  fill="#6B7280" 
                  fillOpacity={0.1}
                  name="Target"
                />
              </AreaChart>
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
              <RadarChart data={mechanicalTrainingData}>
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
              {mechanicsWorkloadData.map((mech, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300 font-medium">{mech.mechanic}</p>
                    <span className="text-xs text-gray-500">
                      {mech.preventive + mech.corrective + mech.projects} hrs/week
                    </span>
                  </div>
                  <div className="flex h-6 rounded-lg overflow-hidden bg-gray-800">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${mech.preventive}%` }}
                    >
                      {mech.preventive}%
                    </div>
                    <div 
                      className="bg-amber-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${mech.corrective}%` }}
                    >
                      {mech.corrective}%
                    </div>
                    <div 
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${mech.projects}%` }}
                    >
                      {mech.projects}%
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

        {/* Third Row - Maintenance Backlog & Fault Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Maintenance Backlog Tracking */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiPercent className="mr-2 text-amber-400" />
                Maintenance Backlog Status
              </h3>
              <span className="text-xs text-gray-400">Last 4 weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={maintenanceBacklogData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="onSchedule" stackId="a" fill="#10B981" name="On Schedule" />
                <Bar dataKey="dueSoon" stackId="a" fill="#F59E0B" name="Due Soon" />
                <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mechanical Fault Distribution */}
          <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FiPieChart className="mr-2 text-purple-400" />
                Fault Category Analysis
              </h3>
              <span className="text-xs text-gray-400">Current month</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mechanicalFaultData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                >
                  {mechanicalFaultData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
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
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">8 Due</span>
            </div>
            <h3 className="text-sm font-semibold text-white text-left">Training Overview</h3>
            <p className="text-xs text-gray-400 text-left mt-1">Certifications & compliance</p>
          </button>

          <button className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-400">95.2%</span>
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
                  <p className="text-sm font-medium text-white">John Anderson</p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-400">Electrical Manager • Pacific Voyager</p>
                <p className="text-sm text-gray-300 mt-2">We're planning a major generator overhaul next week. Will need mechanical support for alignment and vibration testing.</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-white">Sarah Williams</p>
                  <span className="text-xs text-gray-500">4h ago</span>
                </div>
                <p className="text-xs text-gray-400">HSE Manager • Fleet</p>
                <p className="text-sm text-gray-300 mt-2">New confined space procedures are now in effect. Please ensure all mechanics complete the updated training module.</p>
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
                    <p className="text-sm font-medium text-white">Bearing Failure Pattern</p>
                    <p className="text-xs text-gray-400 mt-1">Analysis shows 40% of bearing failures occur after 2,400 operating hours. Consider preventive replacement at 2,200 hours.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start">
                  <FiUsers className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Workload Imbalance</p>
                    <p className="text-xs text-gray-400 mt-1">3 mechanics handling 60% of corrective work. Recommend redistributing assignments for better balance.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-start">
                  <FiDroplet className="w-4 h-4 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Oil Analysis Trend</p>
                    <p className="text-xs text-gray-400 mt-1">Increasing particle count in hydraulic systems across fleet. Schedule system flushes within 30 days.</p>
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

export default MechanicalManagerDashboard;