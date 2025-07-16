import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle, FiAlertCircle, FiTool, FiFileText, FiCpu, FiPackage, FiMessageSquare, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Equipment {
  id: string;
  name: string;
  area: string;
  status: 'operational' | 'maintenance' | 'fault';
  model: string;
  voltage: string;
  power: string;
  lastMaintenance: string;
  nextMaintenance: string;
  photo?: string;
}

const EquipmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { equipmentId } = useParams();
  const location = useLocation();
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Get equipment data from location state or mock it
    if (location.state) {
      setEquipment({
        id: equipmentId || '',
        name: location.state.name,
        area: location.state.area,
        status: location.state.status || 'operational',
        model: 'Model XYZ-2000',
        voltage: '440V',
        power: '750kW',
        lastMaintenance: location.state.lastMaintenance || '2024-11-15',
        nextMaintenance: '2025-02-15'
      });
    } else {
      // Mock data for demo
      setEquipment({
        id: equipmentId || 'hpu-1-motor',
        name: 'HPU 1 Motor',
        area: 'HPU',
        status: 'operational',
        model: 'ABB M3BP 355SMC 2',
        voltage: '440V',
        power: '750kW',
        lastMaintenance: '2024-11-15',
        nextMaintenance: '2025-02-15'
      });
    }
  }, [equipmentId, location.state]);

  const handleCriticalBreakdown = () => {
    // Store equipment info for fault flow
    sessionStorage.setItem('fault_equipment', JSON.stringify({
      id: equipment?.id,
      name: equipment?.name,
      area: equipment?.area
    }));
    sessionStorage.setItem('fault_source', 'equipment-detail');
    navigate('/fault/critical');
  };

  const handleMinorFault = () => {
    // Store equipment info for fault flow
    sessionStorage.setItem('fault_equipment', JSON.stringify({
      id: equipment?.id,
      name: equipment?.name,
      area: equipment?.area
    }));
    sessionStorage.setItem('fault_source', 'equipment-detail');
    navigate('/fault/minor');
  };

  if (!equipment) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-900/30';
      case 'maintenance': return 'text-amber-400 bg-amber-900/30';
      case 'fault': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <FiCheckCircle className="w-5 h-5" />;
      case 'maintenance': return <FiClock className="w-5 h-5" />;
      case 'fault': return <FiAlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiTool className="w-6 h-6 text-sms-cyan" />
                <h1 className="text-xl font-bold text-white">Equipment Details</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Emergency Actions - Prominent at top */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleCriticalBreakdown}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiAlertTriangle className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-bold text-lg">Report Critical Breakdown</p>
                  <p className="text-sm text-red-200">Equipment not functioning</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-200">Urgent Response</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleMinorFault}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiAlertCircle className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-bold text-lg">Report Minor Fault</p>
                  <p className="text-sm text-amber-200">Equipment needs attention</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-200">Log Issue</p>
              </div>
            </div>
          </button>
        </div>

        {/* Equipment Information */}
        <div className="bg-sms-dark rounded-xl border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equipment Photo/Visual */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg aspect-square flex items-center justify-center">
                <FiTool className="w-24 h-24 text-gray-600" />
              </div>
            </div>

            {/* Equipment Details */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{equipment.name}</h2>
                  <p className="text-gray-400">ID: {equipment.id}</p>
                </div>
                <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(equipment.status)}`}>
                  {getStatusIcon(equipment.status)}
                  <span className="capitalize font-semibold">{equipment.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Area</p>
                  <p className="text-white font-semibold">{equipment.area}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Model</p>
                  <p className="text-white font-semibold">{equipment.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Voltage</p>
                  <p className="text-white font-semibold">{equipment.voltage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Power</p>
                  <p className="text-white font-semibold">{equipment.power}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Last Maintenance</p>
                  <p className="text-white font-semibold">{new Date(equipment.lastMaintenance).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Next Maintenance</p>
                  <p className="text-white font-semibold">{new Date(equipment.nextMaintenance).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Navigation Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/equipment/${equipment.id}/history`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiClock className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">Maintenance History</p>
                <p className="text-sm text-gray-400">View past maintenance</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/equipment/${equipment.id}/documents`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiFileText className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">Technical Documents</p>
                <p className="text-sm text-gray-400">Manuals & guides</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/equipment/${equipment.id}/schematics`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiCpu className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">Electrical Schematics</p>
                <p className="text-sm text-gray-400">Interactive diagrams</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/equipment/${equipment.id}/parts`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiPackage className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">Parts Inventory</p>
                <p className="text-sm text-gray-400">Available parts</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/equipment/${equipment.id}/breakdowns`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiAlertCircle className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">Breakdown Reports</p>
                <p className="text-sm text-gray-400">Fault history</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/equipment/${equipment.id}/ai-assistant`)}
            className="bg-sms-dark border border-gray-700 hover:border-sms-cyan p-4 rounded-xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <FiMessageSquare className="w-6 h-6 text-sms-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold text-white">AI Assistance</p>
                <p className="text-sm text-gray-400">Get troubleshooting help</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;