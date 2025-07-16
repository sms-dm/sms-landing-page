import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiArrowRight, FiAlertCircle, FiCheckCircle, FiClock, FiAnchor, FiPackage, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Equipment, EquipmentTransfer } from '../types';
import EquipmentTransferModal from '../components/equipment/EquipmentTransferModal';
import { mapCriticalityLabel } from '../utils/criticality';

export default function EquipmentListWithTransfer() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [transfers, setTransfers] = useState<EquipmentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [criticalityFilter, setCriticalityFilter] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment');

  useEffect(() => {
    fetchEquipment();
    if (activeTab === 'transfers') {
      fetchTransfers();
    }
  }, [activeTab]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/equipment', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers/vessel/1', { // TODO: Get actual vessel ID
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      }
    } catch (error) {
      console.error('Failed to load transfers');
    }
  };

  const handleTransfer = async (transferData: any) => {
    try {
      const response = await fetch('/api/transfers/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        toast.success('Equipment transferred successfully');
        fetchEquipment();
        setShowTransferModal(false);
        setSelectedEquipment(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to transfer equipment');
      }
    } catch (error) {
      toast.error('Failed to transfer equipment');
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return <FiCheckCircle className="text-green-500" />;
      case 'maintenance': return <FiClock className="text-yellow-500" />;
      case 'fault': return <FiAlertCircle className="text-red-500" />;
      default: return null;
    }
  };

  const getClassificationIcon = (classification?: Equipment['classification']) => {
    switch (classification) {
      case 'PERMANENT': return <FiAnchor className="text-gray-600" />;
      case 'TEMPORARY': return <FiPackage className="text-blue-600" />;
      case 'RENTAL': return <FiDollarSign className="text-orange-600" />;
      default: return null;
    }
  };

  const getCriticalityColor = (criticality?: Equipment['criticality']) => {
    switch (criticality) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'IMPORTANT': return 'text-orange-600 bg-orange-50';
      case 'STANDARD': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesClassification = classificationFilter === 'all' || item.classification === classificationFilter;
    const matchesCriticality = criticalityFilter === 'all' || item.criticality === criticalityFilter;
    
    return matchesSearch && matchesStatus && matchesClassification && matchesCriticality;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-2">Manage and transfer equipment between vessels</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'equipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Equipment List
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transfers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transfer History
            </button>
          </div>
        </div>

        {activeTab === 'equipment' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="fault">Fault</option>
                </select>

                <select
                  value={classificationFilter}
                  onChange={(e) => setClassificationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="PERMANENT">Permanent</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="RENTAL">Rental</option>
                </select>

                <select
                  value={criticalityFilter}
                  onChange={(e) => setCriticalityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Criticality</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="IMPORTANT">Major</option>
                  <option value="STANDARD">Minor</option>
                </select>
              </div>
            </div>

            {/* Equipment List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiFilter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No equipment found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.qr_code}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          {getClassificationIcon(item.classification)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Manufacturer:</span>
                          <span className="font-medium">{item.manufacturer || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{item.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{item.location}</span>
                        </div>
                        {item.criticality && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Criticality:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCriticalityColor(item.criticality)}`}>
                              {mapCriticalityLabel(item.criticality)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => navigate(`/equipment/${item.id}`)}
                          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        {item.classification !== 'PERMANENT' && (
                          <button
                            onClick={() => {
                              setSelectedEquipment(item);
                              setShowTransferModal(true);
                            }}
                            className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center"
                          >
                            <FiArrowRight className="mr-2" />
                            Transfer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Transfer History Tab */
          <div className="bg-white rounded-lg shadow-sm">
            {transfers.length === 0 ? (
              <div className="p-12 text-center">
                <FiArrowRight className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No equipment transfers recorded</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Vessel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Vessel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transfer Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transferred By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transfer.equipment_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transfer.qr_code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.from_vessel_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.to_vessel_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transfer.transfer_reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.transferred_by_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transfer Modal */}
        <EquipmentTransferModal
          equipment={selectedEquipment}
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedEquipment(null);
          }}
          onTransfer={handleTransfer}
        />
      </div>
    </div>
  );
}