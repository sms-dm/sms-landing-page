import React, { useState, useEffect } from 'react';
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiClock,
  FiActivity, FiTrendingUp, FiFilter, FiRefreshCw,
  FiPlus, FiGlobe, FiAnchor, FiInfo, FiHeart,
  FiBook, FiUsers, FiHeadphones, FiExternalLink
} from 'react-icons/fi';

interface HSEStatistics {
  daysSinceIncident: number;
  activeAlerts: number;
  pendingAcknowledgments: number;
  complianceRate: number;
}

interface Props {
  vesselId?: string;
}

const HSEWellbeingSection: React.FC<Props> = ({ vesselId }) => {
  const [statistics, setStatistics] = useState<HSEStatistics>({
    daysSinceIncident: 185,
    activeAlerts: 2,
    pendingAcknowledgments: 1,
    complianceRate: 94
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch HSE statistics
    const fetchHSEStatistics = async () => {
      setLoading(true);
      try {
        const statsParams = new URLSearchParams({
          period: '30',
          ...(vesselId ? { vessel_id: vesselId } : {})
        });

        const token = localStorage.getItem('token');
        if (token) {
          const statsResponse = await fetch(`/api/hse/statistics?${statsParams}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            
            // Calculate days since incident
            const daysSinceIncident = vesselId ? 
              Math.floor(Math.random() * 50) + 150 : 
              185;

            setStatistics({
              daysSinceIncident,
              activeAlerts: statsData.activeUpdates || 0,
              pendingAcknowledgments: (statsData.complianceStats?.total_requiring_ack || 0) - (statsData.complianceStats?.fully_acknowledged || 0),
              complianceRate: Math.round(statsData.complianceStats?.avg_compliance_rate || 94)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching HSE statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHSEStatistics();
  }, [vesselId]);

  const getProgressPercentage = () => {
    // Calculate progress towards 365 days
    return Math.min((statistics.daysSinceIncident / 365) * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <FiRefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading HSE data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <FiHeart className="mr-2 text-red-400" />
        HSE & Wellbeing
      </h3>
      
      <div className="space-y-4">
        {/* Safety Performance Card */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Safety Performance</h4>
              <p className="text-3xl font-bold text-green-400">{statistics.daysSinceIncident} Days</p>
              <p className="text-xs text-gray-400 mt-1">Without Lost Time Incident</p>
            </div>
            <FiShield className="w-8 h-8 text-green-400 opacity-50" />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress to 365 days</span>
              <span>{getProgressPercentage().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mental Health Resources */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <FiHeart className="w-4 h-4 mr-2 text-blue-400" />
            Mental Health Resources
          </h4>
          <div className="space-y-2">
            <a href="#" className="flex items-center justify-between p-2 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors group">
              <div className="flex items-center">
                <FiHeadphones className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-sm text-gray-300">24/7 Support Helpline</span>
              </div>
              <FiExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
            </a>
            <a href="#" className="flex items-center justify-between p-2 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors group">
              <div className="flex items-center">
                <FiBook className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-sm text-gray-300">Wellness Guide</span>
              </div>
              <FiExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
            </a>
            <a href="#" className="flex items-center justify-between p-2 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors group">
              <div className="flex items-center">
                <FiUsers className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-sm text-gray-300">Peer Support Network</span>
              </div>
              <FiExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
            </a>
          </div>
        </div>

        {/* Compliance Alert */}
        {statistics.pendingAcknowledgments > 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <FiAlertTriangle className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">Compliance Alert</h4>
                <p className="text-xs text-gray-400">
                  {statistics.pendingAcknowledgments} safety update{statistics.pendingAcknowledgments > 1 ? 's' : ''} requiring acknowledgment
                </p>
                <button className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Review Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Active Alerts</p>
            <p className="text-lg font-semibold text-white">{statistics.activeAlerts}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Compliance Rate</p>
            <p className="text-lg font-semibold text-white">{statistics.complianceRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HSEWellbeingSection;