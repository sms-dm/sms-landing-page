import React, { useState, useEffect } from 'react';
import {
  FiX, FiAlertTriangle, FiInfo, FiFileText, FiBook,
  FiShield, FiCheckCircle, FiUser, FiCalendar, FiTag
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { canCreateHSEUpdate } from '../utils/permissions';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  vesselId?: string;
}

interface Vessel {
  id: number;
  name: string;
}

const HSEUpdateModal: React.FC<Props> = ({ onClose, onSuccess, vesselId }) => {
  const { user } = useAuth();
  
  // Check what scopes user can create
  const userPermissions = user ? {
    id: user.id,
    role: user.role as any,
    department: user.department as any,
    vessel_id: user.default_vessel_id
  } : null;
  
  const canCreateFleet = userPermissions ? canCreateHSEUpdate(userPermissions, 'fleet') : false;
  const canCreateVessel = userPermissions ? canCreateHSEUpdate(userPermissions, 'vessel') : false;
  const canCreateDepartment = userPermissions ? canCreateHSEUpdate(userPermissions, 'department') : false;
  
  // Set default scope based on user permissions
  const defaultScope = canCreateFleet ? 'fleet' : canCreateVessel ? 'vessel' : 'department';
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    update_type: 'safety_alert',
    severity: 'medium',
    scope: defaultScope,
    vessel_id: vesselId || user?.default_vessel_id?.toString() || '',
    department: user?.department || '',
    requires_acknowledgment: false,
    acknowledgment_deadline: '',
    expires_at: '',
    tags: ''
  });

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateTypes = [
    { value: 'safety_alert', label: 'Safety Alert', icon: <FiAlertTriangle /> },
    { value: 'procedure_update', label: 'Procedure Update', icon: <FiFileText /> },
    { value: 'incident_report', label: 'Incident Report', icon: <FiShield /> },
    { value: 'best_practice', label: 'Best Practice', icon: <FiCheckCircle /> },
    { value: 'regulatory_update', label: 'Regulatory Update', icon: <FiBook /> },
    { value: 'training', label: 'Training', icon: <FiUser /> }
  ];

  const severities = [
    { value: 'critical', label: 'Critical', color: 'text-red-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'medium', label: 'Medium', color: 'text-amber-400' },
    { value: 'low', label: 'Low', color: 'text-blue-400' },
    { value: 'info', label: 'Info', color: 'text-gray-400' }
  ];

  const departments = [
    'Deck', 'Engineering', 'Electrical', 'Safety', 'Operations', 'Management'
  ];

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      const response = await fetch('/api/vessels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVessels(data);
      }
    } catch (error) {
      console.error('Error fetching vessels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        vessel_id: formData.scope === 'vessel' ? formData.vessel_id : null,
        department: formData.scope === 'department' ? formData.department : null,
        acknowledgment_deadline: formData.requires_acknowledgment && formData.acknowledgment_deadline 
          ? formData.acknowledgment_deadline 
          : null,
        expires_at: formData.expires_at || null
      };

      const response = await fetch('/api/hse/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create HSE update');
      }
    } catch (error) {
      setError('An error occurred while creating the update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-sms-dark border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FiShield className="mr-2 text-green-400" />
              Create HSE Update
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              rows={4}
              required
            />
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-2 gap-4">
            {/* Update Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Update Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.update_type}
                onChange={(e) => setFormData({ ...formData, update_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                required
              >
                {updateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Severity <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                required
              >
                {severities.map((severity) => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Scope <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center space-x-4">
              {canCreateFleet && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="fleet"
                    checked={formData.scope === 'fleet'}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Fleet-wide</span>
                </label>
              )}
              {canCreateVessel && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="vessel"
                    checked={formData.scope === 'vessel'}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Specific Vessel</span>
                </label>
              )}
              {canCreateDepartment && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="department"
                    checked={formData.scope === 'department'}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Department</span>
                </label>
              )}
            </div>
            {user?.role === 'hse' && (
              <p className="text-xs text-gray-400 mt-1">
                As HSE Officer, you can only create vessel-specific updates for your assigned vessel
              </p>
            )}
          </div>

          {/* Vessel Selection (if scope is vessel) */}
          {formData.scope === 'vessel' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Vessel <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.vessel_id}
                onChange={(e) => setFormData({ ...formData, vessel_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                required
                disabled={user?.role === 'hse'} // HSE officers can only use their assigned vessel
              >
                <option value="">Select a vessel</option>
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Selection (if scope is department) */}
          {formData.scope === 'department' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                required
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Acknowledgment Required */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_acknowledgment}
                onChange={(e) => setFormData({ ...formData, requires_acknowledgment: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">Requires acknowledgment</span>
            </label>
          </div>

          {/* Acknowledgment Deadline (if required) */}
          {formData.requires_acknowledgment && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Acknowledgment Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.acknowledgment_deadline}
                onChange={(e) => setFormData({ ...formData, acknowledgment_deadline: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              />
            </div>
          )}

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="safety, electrical, urgent"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HSEUpdateModal;