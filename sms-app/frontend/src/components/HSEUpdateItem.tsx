import React from 'react';
import {
  FiAlertTriangle, FiInfo, FiFileText, FiBook, FiShield,
  FiCheckCircle, FiClock, FiUser, FiTag, FiCalendar
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

interface HSEUpdate {
  id: number;
  title: string;
  content: string;
  update_type: 'safety_alert' | 'procedure_update' | 'incident_report' | 'best_practice' | 'regulatory_update' | 'training';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scope: 'fleet' | 'vessel' | 'department';
  vessel_name?: string;
  department?: string;
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
}

interface Props {
  update: HSEUpdate;
  onAcknowledge: (updateId: number) => void;
  isCompact?: boolean;
}

const HSEUpdateItem: React.FC<Props> = ({ update, onAcknowledge, isCompact = false }) => {
  const { user } = useAuth();

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'border-red-500 bg-red-900/20',
          textColor: 'text-red-400',
          icon: <FiAlertTriangle className="w-4 h-4" />,
          label: 'CRITICAL'
        };
      case 'high':
        return {
          color: 'border-orange-500 bg-orange-900/20',
          textColor: 'text-orange-400',
          icon: <FiAlertTriangle className="w-4 h-4" />,
          label: 'HIGH'
        };
      case 'medium':
        return {
          color: 'border-amber-500 bg-amber-900/20',
          textColor: 'text-amber-400',
          icon: <FiAlertTriangle className="w-4 h-4" />,
          label: 'MEDIUM'
        };
      case 'low':
        return {
          color: 'border-blue-500 bg-blue-900/20',
          textColor: 'text-blue-400',
          icon: <FiInfo className="w-4 h-4" />,
          label: 'LOW'
        };
      case 'info':
        return {
          color: 'border-gray-500 bg-gray-800/50',
          textColor: 'text-gray-400',
          icon: <FiInfo className="w-4 h-4" />,
          label: 'INFO'
        };
      default:
        return {
          color: 'border-gray-600 bg-gray-800/50',
          textColor: 'text-gray-400',
          icon: <FiInfo className="w-4 h-4" />,
          label: 'INFO'
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety_alert': return <FiAlertTriangle className="w-4 h-4" />;
      case 'procedure_update': return <FiFileText className="w-4 h-4" />;
      case 'incident_report': return <FiShield className="w-4 h-4" />;
      case 'best_practice': return <FiCheckCircle className="w-4 h-4" />;
      case 'regulatory_update': return <FiBook className="w-4 h-4" />;
      case 'training': return <FiUser className="w-4 h-4" />;
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  const formatType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const isOverdue = () => {
    if (!update.acknowledgment_deadline || update.is_acknowledged) return false;
    return new Date(update.acknowledgment_deadline) < new Date();
  };

  const severityConfig = getSeverityConfig(update.severity);

  return (
    <div className={`p-4 rounded-lg border ${severityConfig.color} transition-all hover:shadow-lg hover:shadow-${severityConfig.textColor}/20`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${severityConfig.color} ${severityConfig.textColor}`}>
              {severityConfig.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm">{update.title}</h4>
              <div className="flex items-center space-x-3 mt-1">
                {/* Severity Badge */}
                <span className={`text-xs px-2 py-0.5 rounded ${severityConfig.color} ${severityConfig.textColor} font-medium`}>
                  {severityConfig.label}
                </span>
                
                {/* Type */}
                <span className="text-xs text-gray-400 flex items-center">
                  {getTypeIcon(update.update_type)}
                  <span className="ml-1">{formatType(update.update_type)}</span>
                </span>

                {/* Scope */}
                <span className="text-xs text-gray-500">
                  {update.scope === 'fleet' && 'Fleet-wide'}
                  {update.scope === 'vessel' && update.vessel_name && `Vessel: ${update.vessel_name}`}
                  {update.scope === 'department' && update.department && `Dept: ${update.department}`}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          {!isCompact && (
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{update.content}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <FiUser className="w-3 h-3 mr-1" />
                {update.creator_name}
              </span>
              <span className="flex items-center">
                <FiClock className="w-3 h-3 mr-1" />
                {formatDate(update.created_at)}
              </span>
              {update.acknowledgment_count !== undefined && (
                <span className="flex items-center">
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  {update.acknowledgment_count} acknowledged
                </span>
              )}
            </div>

            {/* Acknowledgment Section */}
            {update.requires_acknowledgment && (
              <div className="flex items-center space-x-2">
                {update.is_acknowledged ? (
                  <span className="flex items-center text-xs text-green-400">
                    <FiCheckCircle className="w-4 h-4 mr-1" />
                    Acknowledged
                  </span>
                ) : (
                  <>
                    {update.acknowledgment_deadline && (
                      <span className={`text-xs ${isOverdue() ? 'text-red-400' : 'text-gray-400'}`}>
                        Due: {new Date(update.acknowledgment_deadline).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      onClick={() => onAcknowledge(update.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        isOverdue()
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Acknowledge
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {update.tags && update.tags.length > 0 && !isCompact && (
            <div className="flex items-center space-x-2 mt-2">
              <FiTag className="w-3 h-3 text-gray-500" />
              {update.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HSEUpdateItem;