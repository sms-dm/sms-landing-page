import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiCalendar, FiAlertCircle, FiCheckCircle, FiTool } from 'react-icons/fi';

interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'Operational' | 'Maintenance' | 'Fault';
  specs: string;
  photo?: string;
  lastMaintenance: Date;
  nextMaintenance: Date;
  area: string;
}

const EquipmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hpu');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Operational' | 'Needs Attention'>('All');

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Equipment data with maintenance dates
  const allEquipment: Equipment[] = [
    // HPU Equipment
    { 
      id: 'hpu-1-starter', 
      name: 'HPU 1 Starter Panel', 
      model: 'SP-450', 
      status: 'Operational', 
      specs: 'Voltage: 440V',
      lastMaintenance: new Date('2024-11-15'),
      nextMaintenance: new Date('2025-02-15'),
      area: 'hpu'
    },
    { 
      id: 'hpu-2-starter', 
      name: 'HPU 2 Starter Panel', 
      model: 'SP-450', 
      status: 'Maintenance', 
      specs: 'Voltage: 440V',
      lastMaintenance: new Date('2024-10-20'),
      nextMaintenance: new Date('2025-01-20'),
      area: 'hpu'
    },
    { 
      id: 'hpu-1-motor', 
      name: 'HPU 1 Motor', 
      model: 'M-750', 
      status: 'Operational', 
      specs: 'Power: 750kW',
      lastMaintenance: new Date('2024-12-01'),
      nextMaintenance: new Date('2025-03-01'),
      area: 'hpu'
    },
    { 
      id: 'hpu-2-motor', 
      name: 'HPU 2 Motor', 
      model: 'M-750', 
      status: 'Operational', 
      specs: 'Power: 750kW',
      lastMaintenance: new Date('2024-12-01'),
      nextMaintenance: new Date('2025-03-01'),
      area: 'hpu'
    },
    { 
      id: 'oil-conditioning', 
      name: 'Oil Conditioning Panel', 
      model: 'OCP-300', 
      status: 'Operational', 
      specs: 'Capacity: 300L',
      lastMaintenance: new Date('2024-11-10'),
      nextMaintenance: new Date('2025-02-10'),
      area: 'hpu'
    },
    
    // Doghouse Equipment
    { 
      id: 'driller-console', 
      name: 'Driller Console', 
      model: 'DC-5000', 
      status: 'Operational', 
      specs: 'Version: 5.2.1',
      lastMaintenance: new Date('2024-12-15'),
      nextMaintenance: new Date('2025-03-15'),
      area: 'doghouse'
    },
    { 
      id: 'scr-panel', 
      name: 'SCR Control Panel', 
      model: 'SCR-750', 
      status: 'Operational', 
      specs: 'Rating: 750A',
      lastMaintenance: new Date('2024-11-25'),
      nextMaintenance: new Date('2025-02-25'),
      area: 'doghouse'
    },
    { 
      id: 'bop-control', 
      name: 'BOP Control Panel', 
      model: 'BOP-500', 
      status: 'Fault', 
      specs: 'Pressure: 5000psi',
      lastMaintenance: new Date('2024-10-05'),
      nextMaintenance: new Date('2025-01-05'),
      area: 'doghouse'
    },
    { 
      id: 'drawworks-control', 
      name: 'Drawworks Control', 
      model: 'DW-3000', 
      status: 'Operational', 
      specs: 'Capacity: 3000HP',
      lastMaintenance: new Date('2024-12-10'),
      nextMaintenance: new Date('2025-03-10'),
      area: 'doghouse'
    },
    
    // Mud System Equipment
    { 
      id: 'mud-pump-1', 
      name: 'Mud Pump 1', 
      model: 'MP-2200', 
      status: 'Operational', 
      specs: 'Pressure: 5000psi',
      lastMaintenance: new Date('2024-11-20'),
      nextMaintenance: new Date('2025-02-20'),
      area: 'mud-system'
    },
    { 
      id: 'mud-pump-2', 
      name: 'Mud Pump 2', 
      model: 'MP-2200', 
      status: 'Maintenance', 
      specs: 'Pressure: 5000psi',
      lastMaintenance: new Date('2024-09-15'),
      nextMaintenance: new Date('2024-12-15'),
      area: 'mud-system'
    },
    { 
      id: 'shale-shaker-1', 
      name: 'Shale Shaker 1', 
      model: 'SS-400', 
      status: 'Operational', 
      specs: 'Flow: 800gpm',
      lastMaintenance: new Date('2024-12-05'),
      nextMaintenance: new Date('2025-03-05'),
      area: 'mud-system'
    },
    { 
      id: 'desander', 
      name: 'Desander Unit', 
      model: 'DS-250', 
      status: 'Operational', 
      specs: 'Capacity: 250gpm',
      lastMaintenance: new Date('2024-11-30'),
      nextMaintenance: new Date('2025-02-28'),
      area: 'mud-system'
    },
    { 
      id: 'desilter', 
      name: 'Desilter Unit', 
      model: 'DT-300', 
      status: 'Operational', 
      specs: 'Capacity: 300gpm',
      lastMaintenance: new Date('2024-11-30'),
      nextMaintenance: new Date('2025-02-28'),
      area: 'mud-system'
    },
    
    // Generators
    { 
      id: 'gen-1', 
      name: 'Generator 1', 
      model: 'CAT-3516', 
      status: 'Operational', 
      specs: 'Power: 2MW',
      lastMaintenance: new Date('2024-10-25'),
      nextMaintenance: new Date('2025-01-25'),
      area: 'generators'
    },
    { 
      id: 'gen-2', 
      name: 'Generator 2', 
      model: 'CAT-3516', 
      status: 'Operational', 
      specs: 'Power: 2MW',
      lastMaintenance: new Date('2024-10-25'),
      nextMaintenance: new Date('2025-01-25'),
      area: 'generators'
    },
    { 
      id: 'gen-3', 
      name: 'Generator 3', 
      model: 'CAT-3516', 
      status: 'Fault', 
      specs: 'Power: 2MW',
      lastMaintenance: new Date('2024-08-15'),
      nextMaintenance: new Date('2024-11-15'),
      area: 'generators'
    },
    { 
      id: 'emergency-gen', 
      name: 'Emergency Generator', 
      model: 'CAT-C32', 
      status: 'Operational', 
      specs: 'Power: 1MW',
      lastMaintenance: new Date('2024-12-20'),
      nextMaintenance: new Date('2025-03-20'),
      area: 'generators'
    },
    
    // Crane Systems
    { 
      id: 'main-crane', 
      name: 'Main Crane', 
      model: 'HC-250', 
      status: 'Operational', 
      specs: 'Capacity: 250T',
      lastMaintenance: new Date('2024-11-05'),
      nextMaintenance: new Date('2025-02-05'),
      area: 'crane-systems'
    },
    { 
      id: 'aux-crane', 
      name: 'Auxiliary Crane', 
      model: 'AC-50', 
      status: 'Operational', 
      specs: 'Capacity: 50T',
      lastMaintenance: new Date('2024-12-12'),
      nextMaintenance: new Date('2025-03-12'),
      area: 'crane-systems'
    },
    { 
      id: 'knuckle-boom', 
      name: 'Knuckle Boom Crane', 
      model: 'KB-30', 
      status: 'Maintenance', 
      specs: 'Capacity: 30T',
      lastMaintenance: new Date('2024-09-20'),
      nextMaintenance: new Date('2024-12-20'),
      area: 'crane-systems'
    },
    
    // Thruster Systems
    { 
      id: 'thruster-1', 
      name: 'Bow Thruster 1', 
      model: 'BT-3000', 
      status: 'Operational', 
      specs: 'Power: 3MW',
      lastMaintenance: new Date('2024-11-18'),
      nextMaintenance: new Date('2025-02-18'),
      area: 'thruster-systems'
    },
    { 
      id: 'thruster-2', 
      name: 'Bow Thruster 2', 
      model: 'BT-3000', 
      status: 'Operational', 
      specs: 'Power: 3MW',
      lastMaintenance: new Date('2024-11-18'),
      nextMaintenance: new Date('2025-02-18'),
      area: 'thruster-systems'
    },
    { 
      id: 'thruster-3', 
      name: 'Stern Thruster 1', 
      model: 'ST-3000', 
      status: 'Operational', 
      specs: 'Power: 3MW',
      lastMaintenance: new Date('2024-12-08'),
      nextMaintenance: new Date('2025-03-08'),
      area: 'thruster-systems'
    },
    { 
      id: 'thruster-4', 
      name: 'Stern Thruster 2', 
      model: 'ST-3000', 
      status: 'Operational', 
      specs: 'Power: 3MW',
      lastMaintenance: new Date('2024-12-08'),
      nextMaintenance: new Date('2025-03-08'),
      area: 'thruster-systems'
    }
  ];

  // Calculate days until next maintenance
  const getDaysUntilMaintenance = (nextMaintenance: Date): number => {
    const today = new Date();
    const diffTime = nextMaintenance.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status icon
  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'Operational':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'Maintenance':
        return <FiTool className="w-5 h-5" />;
      case 'Fault':
        return <FiAlertCircle className="w-5 h-5" />;
    }
  };

  // Get status color classes
  const getStatusClasses = (status: Equipment['status']) => {
    switch (status) {
      case 'Operational':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'Maintenance':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/30';
      case 'Fault':
        return 'bg-red-900/30 text-red-400 border-red-500/30';
    }
  };

  // Get maintenance urgency classes
  const getMaintenanceUrgencyClasses = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-400';
    if (daysUntil <= 7) return 'text-amber-400';
    if (daysUntil <= 30) return 'text-yellow-400';
    return 'text-gray-400';
  };

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    let equipment = allEquipment.filter(eq => eq.area === activeTab);
    
    // Apply search filter
    if (searchQuery) {
      equipment = equipment.filter(eq => 
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter === 'Operational') {
      equipment = equipment.filter(eq => eq.status === 'Operational');
    } else if (statusFilter === 'Needs Attention') {
      equipment = equipment.filter(eq => 
        eq.status === 'Maintenance' || 
        eq.status === 'Fault' || 
        getDaysUntilMaintenance(eq.nextMaintenance) <= 30
      );
    }
    
    return equipment;
  }, [activeTab, searchQuery, statusFilter]);

  const tabs = [
    { id: 'hpu', name: 'HPU', icon: '⚙️' },
    { id: 'doghouse', name: 'Doghouse', icon: '🏠' },
    { id: 'mud-system', name: 'Mud System', icon: '🌊' },
    { id: 'generators', name: 'Generators', icon: '⚡' },
    { id: 'crane-systems', name: 'Crane Systems', icon: '🏗️' },
    { id: 'thruster-systems', name: 'Thruster Systems', icon: '🚢' }
  ];

  const handleEquipmentClick = (equipment: Equipment) => {
    navigate(`/equipment/${equipment.id}`, { state: { equipment } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-bold text-white">Equipment Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search equipment by name or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-sms-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sms-blue transition-colors"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                statusFilter === 'All'
                  ? 'bg-sms-blue text-white'
                  : 'bg-sms-dark text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Operational')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                statusFilter === 'Operational'
                  ? 'bg-green-600 text-white'
                  : 'bg-sms-dark text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Operational
            </button>
            <button
              onClick={() => setStatusFilter('Needs Attention')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                statusFilter === 'Needs Attention'
                  ? 'bg-amber-600 text-white'
                  : 'bg-sms-dark text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Needs Attention
            </button>
          </div>
        </div>

        {/* Area Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-sms-blue text-white'
                  : 'bg-sms-dark text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.map(equipment => {
            const daysUntilMaintenance = getDaysUntilMaintenance(equipment.nextMaintenance);
            
            return (
              <button
                key={equipment.id}
                onClick={() => handleEquipmentClick(equipment)}
                className="bg-sms-dark border border-gray-700 hover:border-sms-blue rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sms-blue/20 text-left group"
              >
                {/* Equipment Photo Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <div className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    {tabs.find(t => t.id === equipment.area)?.icon}
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-sms-blue transition-colors">
                      {equipment.name}
                    </h3>
                    <p className="text-sm text-gray-400">Model: {equipment.model}</p>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getStatusClasses(equipment.status)}`}>
                    {getStatusIcon(equipment.status)}
                    <span>{equipment.status}</span>
                  </div>

                  {/* Maintenance Info */}
                  <div className="space-y-1 pt-2 border-t border-gray-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last maintenance:</span>
                      <span className="text-gray-400">
                        {equipment.lastMaintenance.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Next due:</span>
                      <span className={getMaintenanceUrgencyClasses(daysUntilMaintenance)}>
                        {daysUntilMaintenance < 0 
                          ? `${Math.abs(daysUntilMaintenance)} days overdue`
                          : daysUntilMaintenance === 0
                          ? 'Due today'
                          : `${daysUntilMaintenance} days`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* No Results */}
        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No equipment found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentManagement;