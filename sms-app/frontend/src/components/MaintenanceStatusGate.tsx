import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiAlertCircle, FiCheck, FiTool } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Equipment {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  location: string;
  maintenance_interval_days: number;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  running_hours: number | null;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

interface MaintenanceStatus {
  equipmentId: number;
  lastMaintenanceDate: string;
  currentHours: number;
  notes?: string;
}

const MaintenanceStatusGate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [maintenanceStatuses, setMaintenanceStatuses] = useState<Record<number, MaintenanceStatus>>({});

  useEffect(() => {
    checkMaintenanceStatusAndLoadEquipment();
  }, []);

  const checkMaintenanceStatusAndLoadEquipment = async () => {
    try {
      // Check if maintenance status has already been entered
      const statusResponse = await api.get('/api/user/maintenance-status-complete');
      if (statusResponse.data.isComplete) {
        // If already complete, navigate to dashboard
        navigateToDashboard();
        return;
      }

      // Load equipment that needs status entry
      const equipmentResponse = await api.get('/api/equipment/needs-status');
      
      setEquipment(equipmentResponse.data);
      
      // Initialize maintenance statuses with any existing data
      const initialStatuses: Record<number, MaintenanceStatus> = {};
      equipmentResponse.data.forEach((eq: Equipment) => {
        initialStatuses[eq.id] = {
          equipmentId: eq.id,
          lastMaintenanceDate: eq.last_maintenance_date || new Date().toISOString().split('T')[0],
          currentHours: eq.running_hours || 0,
          notes: ''
        };
      });
      setMaintenanceStatuses(initialStatuses);
      
    } catch (error) {
      console.error('Failed to load equipment:', error);
      toast.error('Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToDashboard = () => {
    const roleRedirects: Record<string, string> = {
      technician: '/dashboard/technician',
      manager: '/dashboard/manager',
      admin: '/dashboard/internal',
      mechanic: '/dashboard/mechanic',
      hse: '/dashboard/hse',
      electrical_manager: '/dashboard/electrical-manager',
      mechanical_manager: '/dashboard/mechanical-manager',
      hse_manager: '/dashboard/hse-manager',
    };
    
    if (user) {
      navigate(roleRedirects[user.role] || '/vessels');
    }
  };

  const handleStatusUpdate = (equipmentId: number, field: keyof MaintenanceStatus, value: any) => {
    setMaintenanceStatuses(prev => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        [field]: value
      }
    }));
  };

  const calculateNextMaintenanceDate = (lastDate: string, intervalDays: number): string => {
    const last = new Date(lastDate);
    const next = new Date(last);
    next.setDate(next.getDate() + intervalDays);
    return next.toISOString().split('T')[0];
  };

  const getMaintenanceStatus = (lastDate: string, intervalDays: number) => {
    const last = new Date(lastDate);
    const next = new Date(last);
    next.setDate(next.getDate() + intervalDays);
    const today = new Date();
    const daysUntilDue = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'text-red-500', bgColor: 'bg-red-500/20', days: Math.abs(daysUntilDue) };
    } else if (daysUntilDue <= 7) {
      return { status: 'due-soon', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', days: daysUntilDue };
    } else {
      return { status: 'ok', color: 'text-green-500', bgColor: 'bg-green-500/20', days: daysUntilDue };
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Submit all maintenance statuses
      const updates = Object.values(maintenanceStatuses).map(status => ({
        ...status,
        nextMaintenanceDate: calculateNextMaintenanceDate(
          status.lastMaintenanceDate,
          equipment.find(eq => eq.id === status.equipmentId)?.maintenance_interval_days || 30
        )
      }));

      await api.post('/api/equipment/bulk-maintenance-status', {
        updates,
        markComplete: true
      });

      toast.success('Maintenance status updated successfully!');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigateToDashboard();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to update maintenance status:', error);
      toast.error('Failed to update maintenance status');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalityColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sms-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading equipment data...</p>
        </div>
      </div>
    );
  }

  const totalSteps = Math.ceil(equipment.length / 3); // Show 3 equipment items per step
  const currentEquipment = equipment.slice(currentStep * 3, (currentStep + 1) * 3);

  return (
    <div className="min-h-screen bg-sms-dark p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-sms-dark-lighter rounded-xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <FiTool className="w-8 h-8 text-sms-cyan mr-3" />
            <h1 className="text-2xl font-bold text-white">Initial Maintenance Status Entry</h1>
          </div>
          <p className="text-gray-400">
            Welcome! Before you can access the dashboard, please enter the current maintenance status 
            for all equipment. This ensures accurate tracking and scheduling.
          </p>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{currentStep + 1} of {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-sms-cyan h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Equipment Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {currentEquipment.map((eq) => {
            const status = maintenanceStatuses[eq.id];
            const maintenanceInfo = status ? getMaintenanceStatus(status.lastMaintenanceDate, eq.maintenance_interval_days) : null;
            
            return (
              <div key={eq.id} className="bg-sms-dark-lighter rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{eq.name}</h3>
                  <p className="text-sm text-gray-400">{eq.model} • {eq.serial_number}</p>
                  <p className="text-sm text-gray-500">{eq.location}</p>
                  <span className={`inline-block mt-2 text-xs font-semibold ${criticalityColors[eq.criticality]}`}>
                    {eq.criticality.toUpperCase()} CRITICALITY
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Last Maintenance Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      <FiCalendar className="inline w-4 h-4 mr-1" />
                      Last Maintenance Date
                    </label>
                    <input
                      type="date"
                      value={status?.lastMaintenanceDate || ''}
                      onChange={(e) => handleStatusUpdate(eq.id, 'lastMaintenanceDate', e.target.value)}
                      className="w-full px-3 py-2 bg-sms-dark rounded-lg border border-gray-600 text-white focus:border-sms-cyan focus:outline-none"
                      required
                    />
                  </div>

                  {/* Current Running Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      <FiClock className="inline w-4 h-4 mr-1" />
                      Current Running Hours
                    </label>
                    <input
                      type="number"
                      value={status?.currentHours || 0}
                      onChange={(e) => handleStatusUpdate(eq.id, 'currentHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-sms-dark rounded-lg border border-gray-600 text-white focus:border-sms-cyan focus:outline-none"
                      placeholder="0"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>

                  {/* Maintenance Status Display */}
                  {maintenanceInfo && (
                    <div className={`p-3 rounded-lg ${maintenanceInfo.bgColor}`}>
                      <div className="flex items-center">
                        <FiAlertCircle className={`w-4 h-4 mr-2 ${maintenanceInfo.color}`} />
                        <span className={`text-sm font-medium ${maintenanceInfo.color}`}>
                          {maintenanceInfo.status === 'overdue' 
                            ? `Overdue by ${maintenanceInfo.days} days`
                            : maintenanceInfo.status === 'due-soon'
                            ? `Due in ${maintenanceInfo.days} days`
                            : `Next maintenance in ${maintenanceInfo.days} days`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={status?.notes || ''}
                      onChange={(e) => handleStatusUpdate(eq.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 bg-sms-dark rounded-lg border border-gray-600 text-white focus:border-sms-cyan focus:outline-none"
                      rows={2}
                      placeholder="Any relevant notes..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Previous
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-3 bg-sms-cyan text-sms-dark rounded-lg font-semibold hover:bg-sms-cyan/90 transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5 mr-2" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStatusGate;