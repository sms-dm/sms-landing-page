import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiFilter } from 'react-icons/fi';
import { EquipmentCard } from '../components/EquipmentCard';
import { mapCriticalityLabel } from '../utils/criticality';
import toast from 'react-hot-toast';

interface Equipment {
  id: number;
  qr_code: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  location: string;
  equipment_type: string;
  status: string;
  criticality?: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
  classification?: 'PERMANENT' | 'TEMPORARY' | 'RENTAL';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
}

const EquipmentListWithCriticality: React.FC = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const vesselId = localStorage.getItem('vesselId') || '1';
      
      const response = await fetch(`/api/equipment/vessel/${vesselId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      toast.error('Error loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCriticality = criticalityFilter === 'all' || item.criticality === criticalityFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCriticality && matchesStatus;
  });

  // Group equipment by criticality
  const groupedEquipment = {
    CRITICAL: filteredEquipment.filter(e => e.criticality === 'CRITICAL'),
    IMPORTANT: filteredEquipment.filter(e => e.criticality === 'IMPORTANT'),
    STANDARD: filteredEquipment.filter(e => e.criticality === 'STANDARD'),
    UNCATEGORIZED: filteredEquipment.filter(e => !e.criticality)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="text-gray-600" size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Equipment Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
            >
              <option value="all">All Criticality Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="IMPORTANT">Major Only</option>
              <option value="STANDARD">Minor Only</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="fault">Fault</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>

        {/* Equipment Lists by Criticality */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading equipment...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Critical Equipment */}
            {groupedEquipment.CRITICAL.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Critical Equipment ({groupedEquipment.CRITICAL.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedEquipment.CRITICAL.map(item => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onClick={() => navigate(`/equipment/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Major Equipment (was Important) */}
            {groupedEquipment.IMPORTANT.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  Major Equipment ({groupedEquipment.IMPORTANT.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedEquipment.IMPORTANT.map(item => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onClick={() => navigate(`/equipment/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Minor Equipment (was Standard) */}
            {groupedEquipment.STANDARD.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Minor Equipment ({groupedEquipment.STANDARD.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedEquipment.STANDARD.map(item => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onClick={() => navigate(`/equipment/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Uncategorized Equipment */}
            {groupedEquipment.UNCATEGORIZED.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  Uncategorized Equipment ({groupedEquipment.UNCATEGORIZED.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedEquipment.UNCATEGORIZED.map(item => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onClick={() => navigate(`/equipment/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredEquipment.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No equipment found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EquipmentListWithCriticality;