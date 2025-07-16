import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiDownload, FiSearch, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiTool, FiEye, FiX, FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { showSuccess, showInfo } from '../utils/toast';
import { NoRecordsState } from '../components/ui/EmptyState';

interface Record {
  id: string;
  date: Date;
  equipment: string;
  equipmentType: string;
  location: string;
  type: 'critical' | 'minor' | 'maintenance' | 'inspection';
  technician: string;
  status: 'active' | 'resolved' | 'pending' | 'in-progress';
  duration: number; // in minutes
  description: string;
  resolution?: string;
  partsUsed?: string[];
  cost?: number;
}

const Records: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'critical' | 'minor' | 'maintenance' | 'inspection'>('critical');
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    resolved: true,
    pending: true,
    'in-progress': true
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Record | null; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock data
  const allRecords: Record[] = [
    // Critical Faults
    {
      id: 'CR001',
      date: new Date('2024-01-15T08:30:00'),
      equipment: 'Top Drive VFD',
      equipmentType: 'VFD',
      location: 'Drill Floor',
      type: 'critical',
      technician: 'John Smith',
      status: 'resolved',
      duration: 240,
      description: 'VFD showing DC bus overvoltage fault. System automatically shut down during operation.',
      resolution: 'Replaced faulty DC bus capacitors. Tested system under load - operating normally.',
      partsUsed: ['DC Bus Capacitor 4700μF 450V (x3)', 'Cooling Fan 24V DC'],
      cost: 2850
    },
    {
      id: 'CR002',
      date: new Date('2024-01-14T22:15:00'),
      equipment: 'Mud Pump #2',
      equipmentType: 'Mud Pump',
      location: 'Pump Room',
      type: 'critical',
      technician: 'Mike Chen',
      status: 'active',
      duration: 180,
      description: 'Excessive vibration detected. Pump automatically tripped on high vibration alarm.',
      resolution: undefined,
      partsUsed: undefined,
      cost: undefined
    },
    {
      id: 'CR003',
      date: new Date('2024-01-13T14:45:00'),
      equipment: 'SCR System',
      equipmentType: 'SCR',
      location: 'SCR Room',
      type: 'critical',
      technician: 'Sarah Williams',
      status: 'resolved',
      duration: 360,
      description: 'Multiple SCR modules showing ground fault. Drilling operations suspended.',
      resolution: 'Identified moisture ingress in cabinet. Cleaned and dried all connections. Replaced damaged control cards.',
      partsUsed: ['SCR Control Card Rev.3 (x2)', 'Silica Gel Packs (x10)'],
      cost: 4200
    },
    // Minor Faults
    {
      id: 'MN001',
      date: new Date('2024-01-15T10:00:00'),
      equipment: 'Drawworks Cooling Fan',
      equipmentType: 'Drawworks',
      location: 'Drill Floor',
      type: 'minor',
      technician: 'Tom Rodriguez',
      status: 'resolved',
      duration: 45,
      description: 'Cooling fan making unusual noise. Bearings showing signs of wear.',
      resolution: 'Replaced fan bearings and performed alignment check.',
      partsUsed: ['Fan Bearing 6205-2RS (x2)'],
      cost: 120
    },
    {
      id: 'MN002',
      date: new Date('2024-01-15T06:30:00'),
      equipment: 'Emergency Stop Circuit',
      equipmentType: 'Control System',
      location: 'Driller\'s Cabin',
      type: 'minor',
      technician: 'John Smith',
      status: 'pending',
      duration: 30,
      description: 'E-stop button sticking intermittently. Requires excessive force to reset.',
      resolution: undefined,
      partsUsed: undefined,
      cost: undefined
    },
    {
      id: 'MN003',
      date: new Date('2024-01-14T16:20:00'),
      equipment: 'Rotary Table Drive',
      equipmentType: 'Rotary Table',
      location: 'Drill Floor',
      type: 'minor',
      technician: 'Mike Chen',
      status: 'in-progress',
      duration: 90,
      description: 'Intermittent communication loss with VFD. No impact on operations yet.',
      resolution: undefined,
      partsUsed: undefined,
      cost: undefined
    },
    // Maintenance Records
    {
      id: 'MT001',
      date: new Date('2024-01-15T07:00:00'),
      equipment: 'Top Drive Motor',
      equipmentType: 'Top Drive',
      location: 'Drill Floor',
      type: 'maintenance',
      technician: 'Sarah Williams',
      status: 'resolved',
      duration: 120,
      description: 'Scheduled 1000-hour maintenance. Motor insulation test and bearing inspection.',
      resolution: 'All parameters within specification. Greased bearings as per OEM schedule.',
      partsUsed: ['Mobilith SHC 220 Grease (2kg)'],
      cost: 180
    },
    {
      id: 'MT002',
      date: new Date('2024-01-14T08:00:00'),
      equipment: 'SCR Cooling System',
      equipmentType: 'SCR',
      location: 'SCR Room',
      type: 'maintenance',
      technician: 'Tom Rodriguez',
      status: 'resolved',
      duration: 180,
      description: 'Monthly cooling system maintenance. Clean filters and check coolant levels.',
      resolution: 'Replaced all air filters. Topped up coolant. System operating at optimal temperature.',
      partsUsed: ['Air Filter 24"x24"x2" (x6)', 'Coolant Concentrate (5L)'],
      cost: 320
    },
    // Inspection Records
    {
      id: 'IN001',
      date: new Date('2024-01-15T09:00:00'),
      equipment: 'Drill Floor Equipment',
      equipmentType: 'Multiple',
      location: 'Drill Floor',
      type: 'inspection',
      technician: 'John Smith',
      status: 'resolved',
      duration: 60,
      description: 'Weekly drill floor electrical inspection. Check all junction boxes and cable connections.',
      resolution: 'All connections secure. No signs of corrosion or damage. Updated inspection log.',
      partsUsed: [],
      cost: 0
    },
    {
      id: 'IN002',
      date: new Date('2024-01-13T13:00:00'),
      equipment: 'Emergency Generator',
      equipmentType: 'Generator',
      location: 'Generator Room',
      type: 'inspection',
      technician: 'Mike Chen',
      status: 'resolved',
      duration: 90,
      description: 'Monthly generator load test and inspection.',
      resolution: 'Generator started and loaded successfully. All parameters normal. Battery voltage good.',
      partsUsed: [],
      cost: 0
    }
  ];

  // Load session storage data
  useEffect(() => {
    const storedFaults = sessionStorage.getItem('sms_fault_reports');
    if (storedFaults) {
      try {
        const faults = JSON.parse(storedFaults);
        // Process and add to records if needed
        console.log('Loaded fault reports from session:', faults);
      } catch (e) {
        console.error('Error loading session data:', e);
      }
    }
  }, []);

  // Filter records based on active tab and filters
  const filteredRecords = useMemo(() => {
    let filtered = allRecords.filter(record => {
      // Tab filter
      if (record.type !== activeTab) return false;

      // Search filter
      if (searchQuery && !record.equipment.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !record.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !record.technician.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Equipment type filter
      if (selectedEquipmentType !== 'all' && record.equipmentType !== selectedEquipmentType) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'all' && record.location !== selectedLocation) {
        return false;
      }

      // Technician filter
      if (selectedTechnician !== 'all' && record.technician !== selectedTechnician) {
        return false;
      }

      // Date range filter
      if (dateRange.start && new Date(dateRange.start) > record.date) return false;
      if (dateRange.end && new Date(dateRange.end) < record.date) return false;

      // Status filter
      if (!statusFilters[record.status]) return false;

      return true;
    });

    // Sort records
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allRecords, activeTab, searchQuery, selectedEquipmentType, selectedLocation, selectedTechnician, dateRange, statusFilters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Get unique values for filters
  const equipmentTypes = Array.from(new Set(allRecords.map(r => r.equipmentType)));
  const locations = Array.from(new Set(allRecords.map(r => r.location)));
  const technicians = Array.from(new Set(allRecords.map(r => r.technician)));

  const handleSort = (key: keyof Record) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    showSuccess('Exporting records to CSV...');
    // In a real app, this would generate and download a CSV file
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress':
        return <FiTool className="w-4 h-4 text-amber-500" />;
      case 'pending':
        return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-400 bg-red-900/20';
      case 'in-progress':
        return 'text-amber-400 bg-amber-900/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'resolved':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Records</h1>
              <p className="text-sm text-gray-400">Historical fault and maintenance data</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Tab Navigation */}
        <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-1 mb-6">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => {
                setActiveTab('critical');
                setCurrentPage(1);
              }}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'critical'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiAlertCircle className="w-4 h-4" />
                <span>Critical Faults</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('minor');
                setCurrentPage(1);
              }}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'minor'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiAlertTriangle className="w-4 h-4" />
                <span>Minor Faults</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('maintenance');
                setCurrentPage(1);
              }}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiTool className="w-4 h-4" />
                <span>Maintenance Records</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('inspection');
                setCurrentPage(1);
              }}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'inspection'
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FiEye className="w-4 h-4" />
                <span>Inspection Records</span>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className={`lg:col-span-1 ${showFilters ? '' : 'hidden lg:block'}`}>
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    className="w-full pl-10 pr-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sms-cyan"
                  />
                  <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Equipment Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Equipment Type</label>
                <select
                  value={selectedEquipmentType}
                  onChange={(e) => setSelectedEquipmentType(e.target.value)}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="all">All Types</option>
                  {equipmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="all">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <div className="space-y-2">
                  {Object.entries(statusFilters).map(([status, checked]) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setStatusFilters(prev => ({ ...prev, [status]: e.target.checked }))}
                        className="w-4 h-4 text-sms-cyan bg-sms-gray border-gray-600 rounded focus:ring-sms-cyan focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-300 capitalize">{status.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Technician Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Technician</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="all">All Technicians</option>
                  {technicians.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEquipmentType('all');
                  setSelectedLocation('all');
                  setSelectedTechnician('all');
                  setDateRange({ start: '', end: '' });
                  setStatusFilters({
                    active: true,
                    resolved: true,
                    pending: true,
                    'in-progress': true
                  });
                }}
                className="w-full py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center space-x-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    <FiFilter className="w-4 h-4" />
                    <span className="text-sm">Filters</span>
                  </button>
                  <p className="text-white">
                    <span className="font-semibold">{filteredRecords.length}</span> records found
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg hover:bg-sms-cyan/30 transition-all"
                >
                  <FiDownload className="w-4 h-4 text-sms-cyan" />
                  <span className="text-sm text-sms-cyan">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sms-dark/80 border-b border-gray-700">
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Date</span>
                          {sortConfig.key === 'date' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('equipment')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Equipment</span>
                          {sortConfig.key === 'equipment' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('type')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Type</span>
                          {sortConfig.key === 'type' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('technician')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Tech</span>
                          {sortConfig.key === 'technician' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Status</span>
                          {sortConfig.key === 'status' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('duration')}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-white"
                        >
                          <span>Duration</span>
                          {sortConfig.key === 'duration' && (
                            sortConfig.direction === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <span className="text-sm font-medium text-gray-400">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No records found matching your filters
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-sms-gray/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm text-white">{record.date.toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{record.date.toLocaleTimeString()}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-white">{record.equipment}</p>
                              <p className="text-xs text-gray-500">{record.location}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-400 capitalize">{record.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-300">{record.technician}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(record.status)}
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                                {record.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-400">{formatDuration(record.duration)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(record);
                              }}
                              className="text-sms-cyan hover:text-white transition-colors"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-sms-dark/80 border-t border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-all ${
                          currentPage === 1
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        <FiChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              currentPage === pageNum
                                ? 'bg-sms-cyan text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-all ${
                          currentPage === totalPages
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sms-dark border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-sms-dark border-b border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedRecord.equipment}</h3>
                  <p className="text-sm text-gray-400">Record ID: {selectedRecord.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Date & Time</p>
                  <p className="text-white">{selectedRecord.date.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Technician</p>
                  <p className="text-white">{selectedRecord.technician}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-white">{selectedRecord.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Equipment Type</p>
                  <p className="text-white">{selectedRecord.equipmentType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedRecord.status)}
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-white">{formatDuration(selectedRecord.duration)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Description</p>
                <p className="text-gray-300 bg-sms-gray/40 p-4 rounded-lg">{selectedRecord.description}</p>
              </div>

              {/* Resolution */}
              {selectedRecord.resolution && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Resolution</p>
                  <p className="text-gray-300 bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                    {selectedRecord.resolution}
                  </p>
                </div>
              )}

              {/* Parts Used */}
              {selectedRecord.partsUsed && selectedRecord.partsUsed.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Parts Used</p>
                  <div className="bg-sms-gray/40 p-4 rounded-lg">
                    <ul className="space-y-1">
                      {selectedRecord.partsUsed.map((part, index) => (
                        <li key={index} className="text-gray-300 flex items-start">
                          <span className="text-sms-cyan mr-2">•</span>
                          {part}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Cost */}
              {selectedRecord.cost !== undefined && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Total Cost</p>
                  <p className="text-2xl font-bold text-sms-cyan">${selectedRecord.cost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;