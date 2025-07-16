import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiActivity, FiTrendingUp, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

interface Analytics {
  stats: {
    total_codes: number;
    activated_codes: number;
    active_codes: number;
    expired_codes: number;
    activation_rate: number;
    avg_days_to_activate: number;
  };
  activationTimes: Array<{
    days_to_activate: number;
    count: number;
  }>;
  failedAttempts: number;
  monthlyTrends: Array<{
    month: string;
    total: number;
    activated: number;
  }>;
}

const ActivationAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/admin/activation/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-12 text-gray-400">
          Loading analytics...
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Activated', value: analytics.stats.activated_codes, color: '#10b981' },
    { name: 'Active', value: analytics.stats.active_codes, color: '#3b82f6' },
    { name: 'Expired', value: analytics.stats.expired_codes, color: '#ef4444' }
  ];

  const activationTimeData = analytics.activationTimes
    .slice(0, 10)
    .map(item => ({
      days: `${item.days_to_activate}d`,
      count: item.count
    }));

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FiActivity className="mr-2" />
          Activation Analytics
        </h2>
        <div className="flex space-x-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
          />
          <span className="text-gray-400 self-center">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Codes</p>
          <p className="text-3xl font-bold text-white">{analytics.stats.total_codes}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Activation Rate</p>
          <p className="text-3xl font-bold text-green-500">{analytics.stats.activation_rate}%</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Avg. Days to Activate</p>
          <p className="text-3xl font-bold text-blue-500">{analytics.stats.avg_days_to_activate}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Failed Attempts</p>
          <p className="text-3xl font-bold text-red-500">{analytics.failedAttempts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Status Distribution */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Code Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time to Activation */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Time to Activation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activationTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="days" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-gray-700/30 rounded-lg p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                name="Total Codes"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="activated" 
                stroke="#10b981" 
                name="Activated"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
        <div className="space-y-2">
          {analytics.stats.activation_rate < 50 && (
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="text-yellow-500 mt-0.5" />
              <p className="text-gray-300 text-sm">
                Low activation rate ({analytics.stats.activation_rate}%). Consider sending reminder emails or extending expiry periods.
              </p>
            </div>
          )}
          {analytics.stats.avg_days_to_activate > 7 && (
            <div className="flex items-start space-x-2">
              <FiClock className="text-blue-500 mt-0.5" />
              <p className="text-gray-300 text-sm">
                Average activation time is {analytics.stats.avg_days_to_activate} days. Consider improving onboarding instructions.
              </p>
            </div>
          )}
          {analytics.failedAttempts > 10 && (
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="text-red-500 mt-0.5" />
              <p className="text-gray-300 text-sm">
                High number of failed activation attempts ({analytics.failedAttempts}). Review activation process for issues.
              </p>
            </div>
          )}
          {analytics.stats.expired_codes > analytics.stats.activated_codes && (
            <div className="flex items-start space-x-2">
              <FiTrendingUp className="text-orange-500 mt-0.5" />
              <p className="text-gray-300 text-sm">
                More codes are expiring than being activated. Consider automatic expiry extensions or better follow-up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationAnalytics;