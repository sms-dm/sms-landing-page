import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiCheckCircle, FiPackage, FiTool, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PartUsed {
  partNo: string;
  name: string;
  quantity: number;
}

const FaultComplete: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { equipment, area, faultType, toolsUsed, startTime } = location.state || {};

  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [resolution, setResolution] = useState('');
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState('Operational');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [downtime, setDowntime] = useState({ hours: 0, minutes: 0 });

  // Calculate downtime for critical faults
  useEffect(() => {
    if (faultType === 'critical' && startTime) {
      const start = new Date(startTime);
      const end = new Date();
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDowntime({ hours, minutes });
    }
  }, [faultType, startTime]);

  // Auto-populate date and time
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Equipment-specific parts
  const getEquipmentParts = () => {
    const equipmentPartMap: Record<string, any[]> = {
      // HPU Equipment Parts
      'hpu-1-starter': [
        { partNo: 'CR-2745', name: 'Control Relay 24VDC', stock: 3, category: 'Control' },
        { partNo: 'MC-450A', name: 'Main Contactor 450A', stock: 1, category: 'Power' },
        { partNo: 'OL-350', name: 'Overload Relay', stock: 2, category: 'Protection' },
        { partNo: 'FS-30A', name: 'Control Fuse 30A', stock: 12, category: 'Protection' },
        { partNo: 'CT-100/5', name: 'Current Transformer', stock: 3, category: 'Monitoring' },
        { partNo: 'IND-24V-R', name: 'Red Indicator Light 24V', stock: 8, category: 'Indication' },
        { partNo: 'IND-24V-G', name: 'Green Indicator Light 24V', stock: 6, category: 'Indication' },
        { partNo: 'PB-NO', name: 'Push Button N.O.', stock: 5, category: 'Control' },
        { partNo: 'PB-NC', name: 'Push Button N.C.', stock: 4, category: 'Control' }
      ],
      'hpu-1-motor': [
        { partNo: 'BRG-6205', name: 'Motor Bearing 6205', stock: 4, category: 'Mechanical' },
        { partNo: 'BRG-6305', name: 'Motor Bearing 6305', stock: 2, category: 'Mechanical' },
        { partNo: 'SEAL-V45', name: 'Shaft Seal V-Ring 45mm', stock: 6, category: 'Sealing' },
        { partNo: 'COUP-FLEX', name: 'Flexible Coupling Insert', stock: 3, category: 'Mechanical' },
        { partNo: 'FAN-450', name: 'Cooling Fan Assembly', stock: 1, category: 'Cooling' },
        { partNo: 'RTD-PT100', name: 'Temperature Sensor PT100', stock: 4, category: 'Monitoring' },
        { partNo: 'VIB-SENS', name: 'Vibration Sensor', stock: 2, category: 'Monitoring' }
      ],
      'mud-pump-1': [
        { partNo: 'VLV-5K', name: 'Valve Assembly 5000psi', stock: 2, category: 'Fluid' },
        { partNo: 'SEAL-MP', name: 'Pump Seal Kit', stock: 5, category: 'Sealing' },
        { partNo: 'LINER-6', name: '6" Pump Liner', stock: 3, category: 'Wear Parts' },
        { partNo: 'PISTON-6', name: '6" Piston Assembly', stock: 2, category: 'Wear Parts' },
        { partNo: 'ROD-PACK', name: 'Packing Assembly', stock: 8, category: 'Sealing' },
        { partNo: 'BRG-CRANK', name: 'Crankshaft Bearing', stock: 1, category: 'Mechanical' },
        { partNo: 'GAUGE-5K', name: 'Pressure Gauge 5000psi', stock: 4, category: 'Monitoring' }
      ],
      // Default parts for unspecified equipment
      'default': [
        { partNo: 'CR-2745', name: 'Control Relay 24VDC', stock: 3, category: 'Control' },
        { partNo: 'MC-450A', name: 'Main Contactor 450A', stock: 1, category: 'Power' },
        { partNo: 'OL-350', name: 'Overload Relay', stock: 2, category: 'Protection' },
        { partNo: 'BRG-6205', name: 'Motor Bearing 6205', stock: 4, category: 'Mechanical' },
        { partNo: 'FS-30A', name: 'Control Fuse 30A', stock: 12, category: 'Protection' },
        { partNo: 'CB-50A', name: 'Circuit Breaker 50A', stock: 2, category: 'Power' },
        { partNo: 'CT-100/5', name: 'Current Transformer', stock: 3, category: 'Monitoring' },
        { partNo: 'IND-24V', name: 'Indicator Light 24V', stock: 8, category: 'Indication' }
      ]
    };

    const equipmentId = equipment?.id || 'default';
    return equipmentPartMap[equipmentId] || equipmentPartMap['default'];
  };

  const availableParts = getEquipmentParts();

  const handleAddPart = (partNo: string) => {
    const part = availableParts.find(p => p.partNo === partNo);
    if (part && !partsUsed.find(p => p.partNo === partNo)) {
      setPartsUsed([...partsUsed, { ...part, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (partNo: string, quantity: number) => {
    setPartsUsed(partsUsed.map(p => 
      p.partNo === partNo ? { ...p, quantity } : p
    ));
  };

  const handleRemovePart = (partNo: string) => {
    setPartsUsed(partsUsed.filter(p => p.partNo !== partNo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare fault report data
    const reportData = {
      technician: `${user?.firstName} ${user?.lastName}`,
      technicianId: user?.id,
      vessel: 'MV Pacific Explorer',
      location: area?.name,
      equipment: equipment?.name,
      equipmentId: equipment?.id,
      faultType,
      description,
      rootCause,
      resolution,
      equipmentStatus,
      followUpRequired,
      followUpNotes,
      downtime: faultType === 'critical' ? `${downtime.hours}h ${downtime.minutes}m` : null,
      partsUsed: partsUsed.map(part => ({
        partNo: part.partNo,
        name: part.name,
        quantity: part.quantity
      })),
      timestamp: new Date().toISOString()
    };

    // Clear critical fault timer
    if (faultType === 'critical') {
      sessionStorage.removeItem('critical_fault_start');
    }
    sessionStorage.removeItem('current_fault');

    // Show success message
    toast.success('Fault report submitted successfully!', { duration: 3000 });

    // Update inventory (this would be an API call in production)
    if (partsUsed.length > 0) {
      // Show inventory update notification
      setTimeout(() => {
        toast.success(`✓ Inventory updated - ${partsUsed.length} part${partsUsed.length > 1 ? 's' : ''} deducted`, {
          duration: 3000
        });
      }, 500);

      // Check for low stock and send procurement alerts
      const lowStockParts = partsUsed.filter(p => {
        const availablePart = availableParts.find(ap => ap.partNo === p.partNo);
        return availablePart && (availablePart.stock - p.quantity) <= 2;
      });

      if (lowStockParts.length > 0) {
        const lowStockDetails = lowStockParts.map(p => {
          const availablePart = availableParts.find(ap => ap.partNo === p.partNo);
          return {
            partNo: p.partNo,
            name: p.name,
            remainingStock: availablePart ? availablePart.stock - p.quantity : 0
          };
        });

        setTimeout(() => {
          toast('📦 Low stock alert sent to procurement', {
            duration: 4000,
            style: {
              background: '#ea580c',
              color: '#fff',
            }
          });
          
          // Log procurement alert details (would be sent to SMS internal system)
          console.log('Procurement Alert:', {
            vessel: 'MV Pacific Explorer',
            equipment: equipment?.name,
            lowStockParts: lowStockDetails,
            faultReport: reportData.timestamp
          });
        }, 1000);
      }
    }

    // Store report in session for demo (would be API call in production)
    const existingReports = JSON.parse(sessionStorage.getItem('fault_reports') || '[]');
    existingReports.push(reportData);
    sessionStorage.setItem('fault_reports', JSON.stringify(existingReports));

    // Navigate back to dashboard
    setTimeout(() => {
      navigate('/dashboard/technician');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-green-900/20 border-b border-green-500/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="w-6 h-6 text-green-500" />
            <h1 className="text-xl font-bold text-white">Complete Fault Report</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auto-populated Information */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Fault Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Technician</label>
                <p className="text-white">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time</label>
                <p className="text-white">{currentDate} {currentTime}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vessel</label>
                <p className="text-white">MV Pacific Explorer</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                <p className="text-white">{area?.name || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Equipment</label>
                <p className="text-white">{equipment?.name || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fault Type</label>
                <p className={`font-semibold ${faultType === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                  {faultType === 'critical' ? 'Critical' : 'Minor'}
                </p>
              </div>
              {faultType === 'critical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    <FiClock className="inline w-4 h-4 mr-1" />
                    Downtime
                  </label>
                  <p className="text-white font-semibold">
                    {downtime.hours}h {downtime.minutes}m
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fault Description */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Fault Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Fault Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  placeholder="Describe the fault in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Root Cause Analysis
                </label>
                <select
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="">Select root cause...</option>
                  <option value="component-failure">Component Failure</option>
                  <option value="wear-tear">Normal Wear & Tear</option>
                  <option value="operator-error">Operator Error</option>
                  <option value="environmental">Environmental Factors</option>
                  <option value="maintenance-overdue">Overdue Maintenance</option>
                  <option value="design-issue">Design Issue</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Resolution Steps <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  placeholder="Describe the steps taken to resolve the issue..."
                />
              </div>
            </div>
          </div>

          {/* Parts Used */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <FiPackage className="w-5 h-5 text-orange-400" />
              <span>Parts Used</span>
              {equipment && (
                <span className="text-sm text-gray-400">• {equipment.name}</span>
              )}
            </h2>

            {partsUsed.length > 0 && (
              <div className="mb-4">
                <div className="bg-sms-gray/30 rounded-lg p-2 mb-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400">
                    <div className="col-span-3">Part Number</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Stock</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {partsUsed.map((part) => {
                    const stockPart = availableParts.find(p => p.partNo === part.partNo);
                    const remainingStock = stockPart ? stockPart.stock - part.quantity : 0;
                    
                    return (
                      <div key={part.partNo} className="bg-sms-gray/50 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3">
                            <p className="text-sm font-mono text-white">{part.partNo}</p>
                          </div>
                          <div className="col-span-5">
                            <p className="text-sm text-gray-300">{part.name}</p>
                          </div>
                          <div className="col-span-2 flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(part.partNo, Math.max(1, part.quantity - 1))}
                              className="w-6 h-6 bg-sms-dark border border-gray-600 rounded hover:bg-gray-700 text-gray-400"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={stockPart?.stock}
                              value={part.quantity}
                              onChange={(e) => handleUpdateQuantity(part.partNo, parseInt(e.target.value) || 1)}
                              className="w-12 px-1 py-1 bg-sms-dark border border-gray-600 rounded text-white text-center text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(part.partNo, part.quantity + 1)}
                              disabled={part.quantity >= (stockPart?.stock || 0)}
                              className="w-6 h-6 bg-sms-dark border border-gray-600 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          <div className="col-span-2 flex items-center justify-between">
                            <span className={`text-sm font-semibold ${
                              remainingStock > 2 ? 'text-green-400' : 
                              remainingStock > 0 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {remainingStock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(part.partNo)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">
                Add Parts from Inventory
              </label>
              
              {/* Group parts by category */}
              <select
                onChange={(e) => handleAddPart(e.target.value)}
                value=""
                className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              >
                <option value="">Select parts used...</option>
                {Object.entries(
                  availableParts
                    .filter(p => !partsUsed.find(pu => pu.partNo === p.partNo))
                    .reduce((acc: Record<string, typeof availableParts>, part) => {
                      const category = part.category || 'Other';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(part);
                      return acc;
                    }, {})
                ).map(([category, parts]) => (
                  <optgroup key={category} label={category}>
                    {parts.map(part => (
                      <option key={part.partNo} value={part.partNo}>
                        {part.partNo} - {part.name} (Stock: {part.stock})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              
              {/* Low stock warning */}
              {partsUsed.some(p => {
                const stockPart = availableParts.find(ap => ap.partNo === p.partNo);
                return stockPart && (stockPart.stock - p.quantity) <= 2;
              }) && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-400">
                    ⚠️ Some parts will be low on stock after this repair. Procurement will be notified.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Status */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Post-Repair Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Equipment Status <span className="text-red-400">*</span>
                </label>
                <select
                  value={equipmentStatus}
                  onChange={(e) => setEquipmentStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="Operational">Operational - Fully Repaired</option>
                  <option value="Degraded">Degraded - Needs Further Work</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="w-4 h-4 text-sms-cyan bg-sms-gray border-gray-600 rounded focus:ring-sms-cyan"
                  />
                  <span className="text-sm font-medium text-gray-400">Follow-up Required</span>
                </label>
              </div>

              {followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Follow-up Notes
                  </label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                    placeholder="Describe required follow-up actions..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/technician')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600/20 border border-green-500/30 text-green-400 font-semibold rounded-lg hover:bg-green-600/30 transition-all duration-300 flex items-center space-x-2"
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaultComplete;