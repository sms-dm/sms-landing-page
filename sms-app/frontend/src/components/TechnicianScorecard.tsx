import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiAward,
  FiActivity,
  FiTool,
  FiZap,
  FiShield,
  FiStar,
  FiLoader,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';
import { format } from 'date-fns';

interface TechnicianScorecardProps {
  technicianId: number;
  vesselId?: number;
  compact?: boolean;
}

interface TechnicianMetrics {
  efficiency_score: number;
  faults_resolved: number;
  critical_faults_resolved: number;
  avg_resolution_time_hours: number;
  first_time_fix_rate: number;
  maintenance_tasks_completed: number;
  rework_count: number;
}

interface Achievement {
  achievement_name: string;
  achievement_description: string;
  earned_date: string;
  achievement_type: string;
}

const TechnicianScorecard: React.FC<TechnicianScorecardProps> = ({
  technicianId,
  vesselId,
  compact = false
}) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TechnicianMetrics | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicianData();
  }, [technicianId, vesselId]);

  const fetchTechnicianData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const params = vesselId ? `?vesselId=${vesselId}` : '';
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3005'}/api/analytics/technician/${technicianId}${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMetrics(response.data.metrics);
      setComparison(response.data.comparison);
      setAchievements(response.data.achievements);
      setHistory(response.data.history);
    } catch (error: any) {
      console.error('Error fetching technician data:', error);
      setError(error.response?.data?.message || 'Failed to load technician data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'speed': return FiZap;
      case 'quality': return FiShield;
      case 'efficiency': return FiTarget;
      case 'critical': return FiStar;
      default: return FiAward;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FiLoader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No performance data available</p>
      </div>
    );
  }

  if (compact) {
    // Compact view for embedding in dashboards
    return (
      <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">My Performance</h3>
          <div className="flex items-center space-x-2">
            <FiActivity className={`w-5 h-5 ${getScoreColor(metrics.efficiency_score)}`} />
            <span className={`text-2xl font-bold ${getScoreColor(metrics.efficiency_score)}`}>
              {metrics.efficiency_score.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Tasks Completed</p>
            <p className="text-lg font-semibold text-white">
              {metrics.faults_resolved + metrics.maintenance_tasks_completed}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Avg Resolution</p>
            <p className="text-lg font-semibold text-white">
              {metrics.avg_resolution_time_hours.toFixed(1)}h
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">First-Time Fix</p>
            <p className="text-lg font-semibold text-white">
              {metrics.first_time_fix_rate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Critical Resolved</p>
            <p className="text-lg font-semibold text-red-400">
              {metrics.critical_faults_resolved}
            </p>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Recent Achievements</p>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 3).map((achievement, index) => {
                const Icon = getAchievementIcon(achievement.achievement_type);
                return (
                  <div key={index} className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                    <Icon className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-white">{achievement.achievement_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Performance Scorecard</h2>
        
        {/* Main Score */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl font-bold ${getScoreColor(metrics.efficiency_score)}`}>
                  {metrics.efficiency_score.toFixed(0)}
                </span>
                <p className="text-xs text-gray-400 mt-1">Efficiency</p>
              </div>
            </div>
          </div>
          
          {comparison && comparison.performance && (
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
              <span className="text-gray-400">vs Vessel Average:</span>
              <span className={`flex items-center ${
                comparison.performance.efficiency === 'above' ? 'text-green-400' : 'text-red-400'
              }`}>
                {comparison.performance.efficiency === 'above' ? (
                  <><FiChevronUp className="w-4 h-4" /> Above</>
                ) : (
                  <><FiChevronDown className="w-4 h-4" /> Below</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FiTool className="w-5 h-5 text-blue-400" />
              <span className="text-xl font-bold text-white">{metrics.faults_resolved}</span>
            </div>
            <p className="text-xs text-gray-400">Faults Resolved</p>
            {metrics.critical_faults_resolved > 0 && (
              <p className="text-xs text-red-400 mt-1">{metrics.critical_faults_resolved} critical</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-5 h-5 text-amber-400" />
              <span className="text-xl font-bold text-white">{metrics.avg_resolution_time_hours.toFixed(1)}h</span>
            </div>
            <p className="text-xs text-gray-400">Avg Resolution</p>
            {comparison && comparison.performance && (
              <p className={`text-xs mt-1 ${
                comparison.performance.resolution_time === 'better' ? 'text-green-400' : 'text-red-400'
              }`}>
                {comparison.performance.resolution_time === 'better' ? 'Faster' : 'Slower'} than avg
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FiTarget className="w-5 h-5 text-green-400" />
              <span className="text-xl font-bold text-white">{metrics.first_time_fix_rate.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-gray-400">First-Time Fix</p>
            {metrics.rework_count > 0 && (
              <p className="text-xs text-orange-400 mt-1">{metrics.rework_count} rework</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FiActivity className="w-5 h-5 text-purple-400" />
              <span className="text-xl font-bold text-white">{metrics.maintenance_tasks_completed}</span>
            </div>
            <p className="text-xs text-gray-400">PM Tasks</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement, index) => {
              const Icon = getAchievementIcon(achievement.achievement_type);
              return (
                <div key={index} className="flex items-start space-x-3 bg-gray-800 rounded-lg p-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{achievement.achievement_name}</p>
                    <p className="text-xs text-gray-400">{achievement.achievement_description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(achievement.earned_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Trend */}
      {history.length > 0 && (
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
          <div className="space-y-3">
            {history.map((period, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <span className="text-sm text-gray-400">
                  {format(new Date(period.period_start), 'MMM yyyy')}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getScoreColor(period.efficiency_score)}`}>
                      {period.efficiency_score.toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-500">Efficiency</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">
                      {period.faults_resolved}
                    </span>
                    <p className="text-xs text-gray-500">Resolved</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">
                      {period.avg_resolution_time_hours.toFixed(1)}h
                    </span>
                    <p className="text-xs text-gray-500">Avg Time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianScorecard;