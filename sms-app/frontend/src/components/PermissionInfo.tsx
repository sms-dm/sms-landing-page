import React from 'react';
import { FiInfo, FiLock, FiUnlock, FiMessageSquare, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getPermissionSummary } from '../utils/permissions';

interface Props {
  className?: string;
  compact?: boolean;
}

const PermissionInfo: React.FC<Props> = ({ className = '', compact = false }) => {
  const { user } = useAuth();

  if (!user) return null;

  const permissions = getPermissionSummary({
    id: user.id,
    role: user.role as any,
    department: user.department as any,
    vessel_id: user.default_vessel_id
  });

  const getRoleIcon = () => {
    switch (user.role) {
      case 'hse':
      case 'hse_manager':
        return <FiShield className="w-5 h-5 text-green-400" />;
      case 'technician':
        return <FiMessageSquare className="w-5 h-5 text-blue-400" />;
      case 'electrical_manager':
      case 'mechanical_manager':
      case 'manager':
        return <FiUnlock className="w-5 h-5 text-purple-400" />;
      case 'admin':
        return <FiLock className="w-5 h-5 text-red-400" />;
      default:
        return <FiInfo className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'hse': return 'HSE Officer';
      case 'hse_manager': return 'HSE Manager';
      case 'electrical_manager': return 'Electrical Manager';
      case 'mechanical_manager': return 'Mechanical Manager';
      case 'technician': return `${user.department || ''} Technician`;
      case 'manager': return 'Manager';
      case 'admin': return 'Administrator';
      default: return user.role;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getRoleIcon()}
        <span className="text-sm text-gray-300">{getRoleLabel()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        {getRoleIcon()}
        <div>
          <h3 className="text-sm font-semibold text-white">Your Permissions</h3>
          <p className="text-xs text-gray-400">{getRoleLabel()}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {permissions.map((permission, index) => (
          <div key={index} className="flex items-start space-x-2">
            <FiInfo className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-300">{permission}</p>
          </div>
        ))}
      </div>

      {user.role === 'technician' && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded">
          <p className="text-xs text-yellow-400">
            <strong>Note:</strong> As a technician, you can only post messages in your department channel.
          </p>
        </div>
      )}

      {user.role === 'hse' && (
        <div className="mt-3 p-2 bg-green-900/20 border border-green-700/50 rounded">
          <p className="text-xs text-green-400">
            <strong>Note:</strong> As HSE Officer, you can create vessel-specific HSE updates only.
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionInfo;