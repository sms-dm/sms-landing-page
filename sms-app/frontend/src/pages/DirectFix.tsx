import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiCheckCircle, FiPackage, FiClock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PartUsed {
  partNo: string;
  name: string;
  quantity: number;
  category?: string;
}

const DirectFix: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [faultType, setFaultType] = useState('');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [resolution, setResolution] = useState('');
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState('Operational');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [downtime, setDowntime] = useState({ hours: 0, minutes: 0 });
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  // Auto-populate current date/time
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Work areas
  const workAreas = [
    { id: 'hpu', name: 'HPU', description: 'Hydraulic Power Unit' },
    { id: 'doghouse', name: 'Doghouse', description: 'Control Room' },
    { id: 'mud-system', name: 'Mud System', description: 'Drilling Fluids' },
    { id: 'generators', name: 'Generators', description: 'Power Generation' },
    { id: 'crane-systems', name: 'Crane Systems', description: 'Lifting Equipment' },
    { id: 'thruster-systems', name: 'Thruster Systems', description: 'Positioning' }
  ];

  // Equipment by area
  const equipmentByArea: Record<string, Array<{id: string, name: string}>> = {
    hpu: [
      { id: 'hpu-1-starter', name: 'HPU 1 Starter Panel' },
      { id: 'hpu-2-starter', name: 'HPU 2 Starter Panel' },
      { id: 'hpu-1-motor', name: 'HPU 1 Motor' },
      { id: 'hpu-2-motor', name: 'HPU 2 Motor' },
      { id: 'oil-conditioning', name: 'Oil Conditioning Panel' }
    ],
    'mud-system': [
      { id: 'mud-pump-1', name: 'Mud Pump 1' },
      { id: 'mud-pump-2', name: 'Mud Pump 2' },
      { id: 'shale-shaker-1', name: 'Shale Shaker 1' },
      { id: 'desander', name: 'Desander Unit' },
      { id: 'desilter', name: 'Desilter Unit' }
    ],
    generators: [
      { id: 'gen-1', name: 'Generator 1' },
      { id: 'gen-2', name: 'Generator 2' },
      { id: 'gen-3', name: 'Generator 3' },
      { id: 'emergency-gen', name: 'Emergency Generator' }
    ],
    doghouse: [
      { id: 'driller-console', name: 'Driller Console' },
      { id: 'scr-panel', name: 'SCR Control Panel' },
      { id: 'bop-control', name: 'BOP Control Panel' },
      { id: 'drawworks-control', name: 'Drawworks Control' }
    ],
    'crane-systems': [
      { id: 'main-crane', name: 'Main Crane' },
      { id: 'aux-crane', name: 'Auxiliary Crane' },
      { id: 'knuckle-boom', name: 'Knuckle Boom Crane' }
    ],
    'thruster-systems': [
      { id: 'thruster-1', name: 'Bow Thruster 1' },
      { id: 'thruster-2', name: 'Bow Thruster 2' },
      { id: 'thruster-3', name: 'Stern Thruster 1' },
      { id: 'thruster-4', name: 'Stern Thruster 2' }
    ]
  };

  // Get parts for selected equipment
  const getEquipmentParts = () => {
    const partsMap: Record<string, any[]> = {
      'hpu-1-starter': [
        { partNo: 'CR-2745', name: 'Control Relay 24VDC', stock: 3, category: 'Control' },
        { partNo: 'MC-450A', name: 'Main Contactor 450A', stock: 1, category: 'Power' },
        { partNo: 'OL-350', name: 'Overload Relay', stock: 2, category: 'Protection' },
        { partNo: 'FS-30A', name: 'Control Fuse 30A', stock: 12, category: 'Protection' }
      ],
      'default': [
        { partNo: 'CR-2745', name: 'Control Relay 24VDC', stock: 3, category: 'Control' },
        { partNo: 'MC-450A', name: 'Main Contactor 450A', stock: 1, category: 'Power' },
        { partNo: 'OL-350', name: 'Overload Relay', stock: 2, category: 'Protection' },
        { partNo: 'BRG-6205', name: 'Motor Bearing 6205', stock: 4, category: 'Mechanical' },
        { partNo: 'FS-30A', name: 'Control Fuse 30A', stock: 12, category: 'Protection' }
      ]
    };
    return partsMap[selectedEquipment] || partsMap['default'];
  };

  const availableParts = selectedEquipment ? getEquipmentParts() : [];

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

  // Calculate downtime from start/end times
  const calculateDowntime = () => {
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const diff = end.getTime() - start.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setDowntime({ hours, minutes });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare report data
    const reportData = {
      technician: `${user?.firstName} ${user?.lastName}`,
      technicianId: user?.id,
      vessel: 'MV Pacific Explorer',
      location: workAreas.find(a => a.id === selectedArea)?.name,
      equipment: equipmentByArea[selectedArea]?.find(e => e.id === selectedEquipment)?.name,
      faultType,
      description,
      rootCause,
      resolution,
      equipmentStatus,
      followUpRequired,
      followUpNotes,
      downtime: `${downtime.hours}h ${downtime.minutes}m`,
      partsUsed: partsUsed.map(part => ({
        partNo: part.partNo,
        name: part.name,
        quantity: part.quantity
      })),
      timestamp: new Date().toISOString(),
      reportType: 'direct-fix'
    };

    // Show success message
    toast.success('Direct fix report submitted successfully!', { duration: 3000 });

    // Update inventory notifications
    if (partsUsed.length > 0) {
      setTimeout(() => {
        toast.success(`✓ Inventory updated - ${partsUsed.length} part${partsUsed.length > 1 ? 's' : ''} deducted`, {
          duration: 3000
        });
      }, 500);
    }

    // Store report
    const existingReports = JSON.parse(sessionStorage.getItem('fault_reports') || '[]');
    existingReports.push(reportData);
    sessionStorage.setItem('fault_reports', JSON.stringify(existingReports));

    // Navigate back
    setTimeout(() => {
      navigate('/dashboard/technician');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-green-900/20 border-b border-green-500/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/technician')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="w-6 h-6 text-green-500" />
                <h1 className="text-xl font-bold text-white">Direct Fix Entry</h1>
              </div>
            </div>
            <p className="text-sm text-gray-400">Post-repair reporting</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
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
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Fault Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="">Select fault type...</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Hydraulic">Hydraulic</option>
                  <option value="Control">Control System</option>
                  <option value="Software">Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Equipment */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Location & Equipment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Location <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedEquipment(''); // Reset equipment when area changes
                  }}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="">Select location...</option>
                  {workAreas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name} - {area.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Equipment <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  required
                  disabled={!selectedArea}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select equipment...</option>
                  {selectedArea && equipmentByArea[selectedArea]?.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Downtime */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <FiClock className="w-5 h-5 text-amber-400" />
              <span>Downtime</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Fault Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => {
                    setStartDateTime(e.target.value);
                    calculateDowntime();
                  }}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Fault End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => {
                    setEndDateTime(e.target.value);
                    calculateDowntime();
                  }}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Total Downtime</label>
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2">
                  <p className="text-amber-400 font-semibold">
                    {downtime.hours}h {downtime.minutes}m
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fault Details */}
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
                  placeholder="Describe the fault that was fixed..."
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
                  placeholder="Describe how the issue was resolved..."
                />
              </div>
            </div>
          </div>

          {/* Parts Used */}
          {selectedEquipment && (
            <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FiPackage className="w-5 h-5 text-orange-400" />
                <span>Parts Used</span>
              </h2>

              {partsUsed.length > 0 && (
                <div className="mb-4 space-y-2">
                  {partsUsed.map((part) => {
                    const stockPart = availableParts.find(p => p.partNo === part.partNo);
                    const remainingStock = stockPart ? stockPart.stock - part.quantity : 0;
                    
                    return (
                      <div key={part.partNo} className="bg-sms-gray/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-white">{part.partNo}</p>
                          <p className="text-xs text-gray-400">{part.name}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
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
                              value={part.quantity}
                              onChange={(e) => handleUpdateQuantity(part.partNo, parseInt(e.target.value) || 1)}
                              className="w-12 px-1 py-1 bg-sms-dark border border-gray-600 rounded text-white text-center text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(part.partNo, part.quantity + 1)}
                              className="w-6 h-6 bg-sms-dark border border-gray-600 rounded hover:bg-gray-700 text-gray-400"
                            >
                              +
                            </button>
                          </div>
                          <span className={`text-sm ${
                            remainingStock > 2 ? 'text-green-400' : 
                            remainingStock > 0 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            Stock: {remainingStock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.partNo)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <select
                onChange={(e) => handleAddPart(e.target.value)}
                value=""
                className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              >
                <option value="">Add parts used...</option>
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
            </div>
          )}

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

export default DirectFix;