import React, { useState, useEffect } from 'react';
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiClock,
  FiActivity, FiTrendingUp, FiFilter, FiRefreshCw,
  FiPlus, FiGlobe, FiAnchor, FiInfo
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import HSEUpdateModal from './HSEUpdateModal';
import HSEUpdateItem from './HSEUpdateItem';
import { canCreateHSEUpdate, PermissionService } from '../utils/permissions';
import Tooltip from './Tooltip';

interface HSEUpdate {
  id: number;
  title: string;
  content: string;
  update_type: 'safety_alert' | 'procedure_update' | 'incident_report' | 'best_practice' | 'regulatory_update' | 'training';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scope: 'fleet' | 'vessel' | 'department';
  vessel_id?: number;
  vessel_name?: string;
  department?: string;
  created_by: number;
  creator_name: string;
  creator_role: string;
  created_at: string;
  expires_at?: string;
  requires_acknowledgment: boolean;
  acknowledgment_deadline?: string;
  is_acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledgment_count?: number;
  tags?: string[];
  is_active: boolean;
}

interface HSEStatistics {
  daysSinceIncident: number;
  activeAlerts: number;
  pendingAcknowledgments: number;
  complianceRate: number;
}

interface Props {
  vesselId?: string;
  isCompact?: boolean;
}

const HSEBoard: React.FC<Props> = ({ vesselId, isCompact = false }) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<HSEUpdate[]>([]);
  const [statistics, setStatistics] = useState<HSEStatistics>({
    daysSinceIncident: 0,
    activeAlerts: 0,
    pendingAcknowledgments: 0,
    complianceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewScope, setViewScope] = useState<'fleet' | 'vessel'>('fleet');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Check if user can create HSE updates based on their role
  const userPermissions = user ? {
    id: user.id,
    role: user.role as any,
    department: user.department as any,
    vessel_id: user.default_vessel_id
  } : null;
  
  const canCreateFleetUpdate = userPermissions ? canCreateHSEUpdate(userPermissions, 'fleet') : false;
  const canCreateVesselUpdate = userPermissions ? canCreateHSEUpdate(userPermissions, 'vessel') : false;
  const canCreateAnyUpdate = canCreateFleetUpdate || canCreateVesselUpdate;

  const fetchHSEData = async () => {
    setLoading(true);
    try {
      // Fetch HSE updates
      const params = new URLSearchParams({
        active_only: 'true',
        limit: isCompact ? '5' : '20',
        ...(viewScope === 'vessel' && vesselId ? { vessel_id: vesselId } : {})
      });

      if (filterSeverity !== 'all') {
        params.append('severity', filterSeverity);
      }

      const updatesResponse = await fetch(`/api/hse/updates?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (updatesResponse.ok) {
        const data = await updatesResponse.json();
        setUpdates(data.updates);
      }

      // Fetch statistics
      const statsParams = new URLSearchParams({
        period: '30',
        ...(viewScope === 'vessel' && vesselId ? { vessel_id: vesselId } : {})
      });

      const statsResponse = await fetch(`/api/hse/statistics?${statsParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Calculate days since incident (mock data for now)
        const daysSinceIncident = vesselId ? 
          Math.floor(Math.random() * 50) + 100 : 
          185;

        setStatistics({
          daysSinceIncident,
          activeAlerts: statsData.activeUpdates || 0,
          pendingAcknowledgments: statsData.complianceStats?.total_requiring_ack - statsData.complianceStats?.fully_acknowledged || 0,
          complianceRate: Math.round(statsData.complianceStats?.avg_compliance_rate || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching HSE data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHSEData();
  }, [viewScope, filterSeverity, vesselId]);

  const handleAcknowledge = async (updateId: number) => {
    try {
      const response = await fetch(`/api/hse/updates/${updateId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchHSEData(); // Refresh data
      }
    } catch (error) {
      console.error('Error acknowledging update:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-amber-500 bg-amber-900/20';
      case 'low': return 'border-blue-500 bg-blue-900/20';
      case 'info': return 'border-gray-500 bg-gray-800/50';
      default: return 'border-gray-600 bg-gray-800/50';
    }
  };

  const getIncidentStatusColor = () => {
    if (statistics.daysSinceIncident >= 100) return 'text-green-400 bg-green-900/20 border-green-500/30';
    if (statistics.daysSinceIncident >= 50) return 'text-amber-400 bg-amber-900/20 border-amber-500/30';
    return 'text-red-400 bg-red-900/20 border-red-500/30';
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
    <>
      <div className={`bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl ${isCompact ? 'p-4' : 'p-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FiShield className="mr-2 text-green-400" />
            HSE Board
          </h3>
          
          {!isCompact && (
            <div className="flex items-center space-x-2">
              {/* Scope Toggle */}
              <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewScope('fleet')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewScope === 'fleet' 
                      ? 'bg-sms-cyan text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FiGlobe className="inline-block w-4 h-4 mr-1" />
                  Fleet
                </button>
                <button
                  onClick={() => setViewScope('vessel')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewScope === 'vessel' 
                      ? 'bg-sms-cyan text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={!vesselId}
                >
                  <FiAnchor className="inline-block w-4 h-4 mr-1" />
                  Vessel
                </button>
              </div>

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sms-cyan"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>

              {/* Create Button */}
              {canCreateAnyUpdate && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>New Update</span>
                  </button>
                  <div className="group relative">
                    <FiInfo className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                    <Tooltip 
                      title="HSE Update Permissions"
                      description={
                        user?.role === 'hse' 
                          ? "As HSE Officer, you can create vessel-specific updates"
                          : user?.role === 'hse_manager'
                          ? "As HSE Manager, you can create fleet-wide and vessel-specific updates"
                          : "You can create HSE updates"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* Days Without Incident */}
          <div className={`p-3 rounded-lg border ${getIncidentStatusColor()}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{statistics.daysSinceIncident}</p>
                <p className="text-xs mt-1">Days Without Incident</p>
              </div>
              <FiTrendingUp className="w-6 h-6 opacity-50" />
            </div>
          </div>

          {/* Active Alerts */}
          <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-400">{statistics.activeAlerts}</p>
                <p className="text-xs text-amber-400/80 mt-1">Active Alerts</p>
              </div>
              <FiAlertTriangle className="w-6 h-6 text-amber-400 opacity-50" />
            </div>
          </div>

          {/* Pending Acknowledgments */}
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{statistics.pendingAcknowledgments}</p>
                <p className="text-xs text-blue-400/80 mt-1">Pending Acks</p>
              </div>
              <FiClock className="w-6 h-6 text-blue-400 opacity-50" />
            </div>
          </div>

          {/* Compliance Rate */}
          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-400">{statistics.complianceRate}%</p>
                <p className="text-xs text-purple-400/80 mt-1">Compliance Rate</p>
              </div>
              <FiCheckCircle className="w-6 h-6 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* HSE Updates List */}
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FiCheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active HSE updates</p>
            </div>
          ) : (
            updates.map((update) => (
              <HSEUpdateItem
                key={update.id}
                update={update}
                onAcknowledge={handleAcknowledge}
                isCompact={isCompact}
              />
            ))
          )}
        </div>

        {/* View All Link */}
        {isCompact && updates.length > 0 && (
          <button className="w-full mt-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
            View All HSE Updates
          </button>
        )}
      </div>

      {/* Create HSE Update Modal */}
      {showCreateModal && (
        <HSEUpdateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchHSEData();
          }}
          vesselId={vesselId}
        />
      )}
    </>
  );
};

export default HSEBoard;