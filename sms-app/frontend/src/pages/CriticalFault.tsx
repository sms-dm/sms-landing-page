import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface WorkArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  equipmentCount: number;
}

interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'Operational' | 'Maintenance' | 'Fault';
  specs: string;
  photo?: string;
}

// Work areas data - defined outside component for consistency
const workAreas: WorkArea[] = [
  {
    id: 'hpu',
    name: 'HPU',
    description: 'Main hydraulic systems and controls',
    icon: '⚙️',
    equipmentCount: 5
  },
  {
    id: 'doghouse',
    name: 'Doghouse',
    description: 'Control room and monitoring systems',
    icon: '🏠',
    equipmentCount: 8
  },
  {
    id: 'mud-system',
    name: 'Mud System',
    description: 'Drilling fluid circulation systems',
    icon: '🌊',
    equipmentCount: 12
  },
  {
    id: 'generators',
    name: 'Generators',
    description: 'Power generation and distribution',
    icon: '⚡',
    equipmentCount: 6
  },
  {
    id: 'crane-systems',
    name: 'Crane Systems',
    description: 'Lifting and positioning equipment',
    icon: '🏗️',
    equipmentCount: 4
  },
  {
    id: 'thruster-systems',
    name: 'Thruster Systems',
    description: 'Dynamic positioning and propulsion',
    icon: '🚢',
    equipmentCount: 8
  }
];

const CriticalFault: React.FC = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<WorkArea | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showLaunchPrompt, setShowLaunchPrompt] = useState(false);

  // Check if coming from equipment detail page
  useEffect(() => {
    const source = sessionStorage.getItem('fault_source');
    if (source === 'equipment-detail') {
      const equipmentData = sessionStorage.getItem('fault_equipment');
      if (equipmentData) {
        const equipment = JSON.parse(equipmentData);
        // Find the matching area
        const area = workAreas.find(a => a.name === equipment.area);
        if (area) {
          setSelectedArea(area);
          setSelectedEquipment({
            id: equipment.id,
            name: equipment.name,
            model: 'Model XYZ-2000',
            status: 'Fault',
            specs: 'Equipment specs'
          });
          setShowLaunchPrompt(true);
        }
        // Clear the session data
        sessionStorage.removeItem('fault_source');
        sessionStorage.removeItem('fault_equipment');
      }
    }
  }, []);

  // Equipment data by area
  const equipmentByArea: Record<string, Equipment[]> = {
    hpu: [
      { id: 'hpu-1-starter', name: 'HPU 1 Starter Panel', model: 'SP-450', status: 'Operational', specs: 'Voltage: 440V' },
      { id: 'hpu-2-starter', name: 'HPU 2 Starter Panel', model: 'SP-450', status: 'Operational', specs: 'Voltage: 440V' },
      { id: 'hpu-1-motor', name: 'HPU 1 Motor', model: 'M-750', status: 'Operational', specs: 'Power: 750kW' },
      { id: 'hpu-2-motor', name: 'HPU 2 Motor', model: 'M-750', status: 'Operational', specs: 'Power: 750kW' },
      { id: 'oil-conditioning', name: 'Oil Conditioning Panel', model: 'OCP-300', status: 'Operational', specs: 'Capacity: 300L' }
    ],
    'mud-system': [
      { id: 'mud-pump-1', name: 'Mud Pump 1', model: 'MP-2200', status: 'Operational', specs: 'Pressure: 5000psi' },
      { id: 'mud-pump-2', name: 'Mud Pump 2', model: 'MP-2200', status: 'Operational', specs: 'Pressure: 5000psi' },
      { id: 'shale-shaker-1', name: 'Shale Shaker 1', model: 'SS-400', status: 'Operational', specs: 'Flow: 800gpm' },
      { id: 'desander', name: 'Desander Unit', model: 'DS-250', status: 'Operational', specs: 'Capacity: 250gpm' },
      { id: 'desilter', name: 'Desilter Unit', model: 'DT-300', status: 'Operational', specs: 'Capacity: 300gpm' }
    ],
    generators: [
      { id: 'gen-1', name: 'Generator 1', model: 'CAT-3516', status: 'Operational', specs: 'Power: 2MW' },
      { id: 'gen-2', name: 'Generator 2', model: 'CAT-3516', status: 'Operational', specs: 'Power: 2MW' },
      { id: 'gen-3', name: 'Generator 3', model: 'CAT-3516', status: 'Operational', specs: 'Power: 2MW' },
      { id: 'emergency-gen', name: 'Emergency Generator', model: 'CAT-C32', status: 'Operational', specs: 'Power: 1MW' }
    ],
    doghouse: [
      { id: 'driller-console', name: 'Driller Console', model: 'DC-5000', status: 'Operational', specs: 'Version: 5.2.1' },
      { id: 'scr-panel', name: 'SCR Control Panel', model: 'SCR-750', status: 'Operational', specs: 'Rating: 750A' },
      { id: 'bop-control', name: 'BOP Control Panel', model: 'BOP-500', status: 'Operational', specs: 'Pressure: 5000psi' },
      { id: 'drawworks-control', name: 'Drawworks Control', model: 'DW-3000', status: 'Operational', specs: 'Capacity: 3000HP' }
    ],
    'crane-systems': [
      { id: 'main-crane', name: 'Main Crane', model: 'HC-250', status: 'Operational', specs: 'Capacity: 250T' },
      { id: 'aux-crane', name: 'Auxiliary Crane', model: 'AC-50', status: 'Operational', specs: 'Capacity: 50T' },
      { id: 'knuckle-boom', name: 'Knuckle Boom Crane', model: 'KB-30', status: 'Operational', specs: 'Capacity: 30T' }
    ],
    'thruster-systems': [
      { id: 'thruster-1', name: 'Bow Thruster 1', model: 'BT-3000', status: 'Operational', specs: 'Power: 3MW' },
      { id: 'thruster-2', name: 'Bow Thruster 2', model: 'BT-3000', status: 'Operational', specs: 'Power: 3MW' },
      { id: 'thruster-3', name: 'Stern Thruster 1', model: 'ST-3000', status: 'Operational', specs: 'Power: 3MW' },
      { id: 'thruster-4', name: 'Stern Thruster 2', model: 'ST-3000', status: 'Operational', specs: 'Power: 3MW' }
    ]
  };

  const handleAreaSelect = (area: WorkArea) => {
    setSelectedArea(area);
  };

  const handleEquipmentSelect = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowLaunchPrompt(true);
  };

  const handleLaunchDiagnostics = () => {
    // Start MTTR timer when launching diagnostic tools
    const timestamp = new Date().toISOString();
    sessionStorage.setItem('critical_fault_start', timestamp);
    
    // Store critical fault data
    const faultData = {
      timestamp: timestamp,
      area: selectedArea?.name,
      equipment: selectedEquipment?.name,
      type: 'critical'
    };
    sessionStorage.setItem('current_fault', JSON.stringify(faultData));
    
    // Show helpful loading message instead
    toast.success('Loading diagnostic tools...', {
      duration: 2000,
      icon: '🔧'
    });
    
    // Navigate to diagnostic tools
    setTimeout(() => {
      navigate('/fault/diagnostic', { 
        state: { 
          equipment: selectedEquipment, 
          area: selectedArea,
          faultType: 'critical' 
        } 
      });
    }, 500);
  };

  const handleBack = () => {
    if (showLaunchPrompt) {
      setShowLaunchPrompt(false);
      setSelectedEquipment(null);
    } else if (selectedArea) {
      setSelectedArea(null);
    } else {
      navigate('/dashboard/technician');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-red-900/20 border-b border-red-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiAlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
                <h1 className="text-xl font-bold text-white">Critical Fault Reporting</h1>
              </div>
            </div>
            <div className="bg-red-900/30 px-4 py-2 rounded-lg border border-red-500/30">
              <p className="text-sm text-red-400">Critical Fault Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {!selectedArea ? (
          // Area Selection
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">Select Work Area</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleAreaSelect(area)}
                  className="bg-sms-dark border border-gray-700 hover:border-red-500 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">{area.icon}</span>
                        <h3 className="text-lg font-semibold text-white">{area.name}</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{area.description}</p>
                      <p className="text-xs text-gray-500">{area.equipmentCount} equipment units</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : showLaunchPrompt && selectedEquipment ? (
          // Launch Diagnostic Tools Prompt
          <div className="max-w-2xl mx-auto">
            <div className="bg-sms-dark border border-red-500/30 rounded-xl p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="w-10 h-10 text-red-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Critical Fault Confirmed</h2>
                <p className="text-gray-400 mb-4">
                  Equipment: <span className="text-white font-semibold">{selectedEquipment.name}</span>
                </p>
                <p className="text-gray-400 mb-2">
                  Location: <span className="text-white">{selectedArea?.name}</span>
                </p>
                <p className="text-gray-400">
                  Status: <span className="text-red-400">{selectedEquipment.status}</span>
                </p>
              </div>

              <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-400 font-semibold mb-1">⚠️ Critical Equipment Fault</p>
                <p className="text-sm text-gray-300">
                  Access comprehensive diagnostic tools, AI assistance, and technical resources to resolve this issue.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchDiagnostics}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <FiAlertCircle className="w-5 h-5" />
                  <span>Launch Diagnostic Tools</span>
                </button>
              </div>
            </div>
          </div>
        ) : selectedArea ? (
          // Equipment Selection
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">
                Select Equipment in {selectedArea.name}
              </h2>
              <p className="text-sm text-gray-400">{selectedArea.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentByArea[selectedArea.id]?.map((equipment) => (
                <button
                  key={equipment.id}
                  onClick={() => handleEquipmentSelect(equipment)}
                  className="bg-sms-dark border border-gray-700 hover:border-red-500 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">{equipment.name}</h3>
                    <div className={`px-2 py-1 rounded text-xs ${
                      equipment.status === 'Operational' 
                        ? 'bg-green-900/30 text-green-400' 
                        : equipment.status === 'Maintenance'
                        ? 'bg-amber-900/30 text-amber-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {equipment.status}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Model: {equipment.model}</p>
                    <p className="text-sm text-gray-400">{equipment.specs}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <FiChevronRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CriticalFault;