import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vessel, OnboardingStatus } from '@/types';
import { 
  Ship, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Calendar,
  Anchor,
  Settings,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Users,
  Loader2
} from 'lucide-react';
import { useGetVesselsQuery, useCreateVesselMutation, useUpdateVesselMutation, useDeleteVesselMutation } from '@/services/vesselApi';
import { useAppDispatch } from '@/hooks/redux';
import { addToast } from '@/store/slices/uiSlice';

interface VesselData extends Vessel {
  assignedManagers?: string[];
  assignedTechnicians?: string[];
}

export const VesselSetup: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<VesselData | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'engine' | 'assignments'>('details');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const dispatch = useAppDispatch();
  
  // Fetch vessels from API
  const { data: vesselsData, isLoading, isError, refetch } = useGetVesselsQuery({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    sort: 'createdAt:desc'
  });
  
  // Mutations
  const [createVessel, { isLoading: isCreating }] = useCreateVesselMutation();
  const [updateVessel, { isLoading: isUpdating }] = useUpdateVesselMutation();
  const [deleteVessel, { isLoading: isDeleting }] = useDeleteVesselMutation();
  
  const vessels = vesselsData?.data || [];
  
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    vesselType: '',
    flag: '',
    yearBuilt: new Date().getFullYear(),
    grossTonnage: 0,
    deadWeight: 0,
    mainEngine: {
      manufacturer: '',
      model: '',
      power: 0,
      rpm: 0
    },
    auxiliaryEngines: [{
      manufacturer: '',
      model: '',
      power: 0,
      quantity: 1
    }]
  });

  // Get company ID from user context (you'll need to implement this)
  const companyId = 'company1'; // TODO: Get from auth context

  // Search is handled by the API query, so we just use the vessels from the response
  const filteredVessels = vessels;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVessel) {
        // Update vessel
        const updates = {
          name: formData.name,
          flag: formData.flag,
          type: formData.vesselType,
          mainEngine: formData.mainEngine,
          auxiliaryEngines: formData.auxiliaryEngines
        };
        
        await updateVessel({ vesselId: editingVessel.id, updates }).unwrap();
        dispatch(addToast({
          title: 'Success',
          description: 'Vessel updated successfully',
          type: 'success'
        }));
      } else {
        // Create new vessel
        const vesselData = {
          companyId,
          name: formData.name,
          imoNumber: formData.imoNumber,
          flag: formData.flag,
          type: formData.vesselType,
          yearBuilt: formData.yearBuilt,
          grossTonnage: formData.grossTonnage,
          deadWeight: formData.deadWeight,
          mainEngine: formData.mainEngine,
          auxiliaryEngines: formData.auxiliaryEngines
        };
        
        await createVessel(vesselData).unwrap();
        dispatch(addToast({
          title: 'Success',
          description: 'Vessel created successfully',
          type: 'success'
        }));
      }
      
      resetForm();
      refetch();
    } catch (error: any) {
      dispatch(addToast({
        title: 'Error',
        description: error.data?.message || 'Failed to save vessel',
        type: 'error'
      }));
    }
  };

  const handleEdit = (vessel: VesselData) => {
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      vesselType: vessel.vesselType,
      flag: vessel.flag,
      yearBuilt: vessel.yearBuilt,
      grossTonnage: vessel.grossTonnage,
      deadWeight: vessel.deadWeight,
      mainEngine: vessel.engineDetails.mainEngine,
      auxiliaryEngines: vessel.engineDetails.auxiliaryEngines
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vessel? All associated data will be lost.')) {
      try {
        await deleteVessel(id).unwrap();
        dispatch(addToast({
          title: 'Success',
          description: 'Vessel deleted successfully',
          type: 'success'
        }));
        refetch();
      } catch (error: any) {
        dispatch(addToast({
          title: 'Error',
          description: error.data?.message || 'Failed to delete vessel',
          type: 'error'
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      imoNumber: '',
      vesselType: '',
      flag: '',
      yearBuilt: new Date().getFullYear(),
      grossTonnage: 0,
      deadWeight: 0,
      mainEngine: {
        manufacturer: '',
        model: '',
        power: 0,
        rpm: 0
      },
      auxiliaryEngines: [{
        manufacturer: '',
        model: '',
        power: 0,
        quantity: 1
      }]
    });
    setEditingVessel(null);
    setShowAddModal(false);
    setActiveTab('details');
  };

  const getStatusIcon = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.NOT_STARTED:
        return <Clock className="h-4 w-4" />;
      case OnboardingStatus.IN_PROGRESS:
        return <AlertCircle className="h-4 w-4" />;
      case OnboardingStatus.REVIEW:
        return <FileText className="h-4 w-4" />;
      case OnboardingStatus.APPROVED:
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.NOT_STARTED:
        return 'text-gray-500 bg-gray-100';
      case OnboardingStatus.IN_PROGRESS:
        return 'text-yellow-700 bg-yellow-100';
      case OnboardingStatus.REVIEW:
        return 'text-blue-700 bg-blue-100';
      case OnboardingStatus.APPROVED:
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const addAuxiliaryEngine = () => {
    setFormData(prev => ({
      ...prev,
      auxiliaryEngines: [...prev.auxiliaryEngines, {
        manufacturer: '',
        model: '',
        power: 0,
        quantity: 1
      }]
    }));
  };

  const removeAuxiliaryEngine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      auxiliaryEngines: prev.auxiliaryEngines.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vessel Setup</h1>
        <p className="mt-2 text-gray-600">Create and manage vessels for equipment onboarding</p>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search vessels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="ml-4 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vessel
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
      
      {/* Error State */}
      {isError && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Error loading vessels</h3>
          <p className="text-gray-500 mt-2">Please try again later</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      )}
      
      {/* Vessels Grid */}
      {!isLoading && !isError && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVessels.map((vessel) => (
          <Card key={vessel.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <Ship className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vessel.name}</h3>
                    <p className="text-sm text-gray-500">IMO: {vessel.imoNumber}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdownId(openDropdownId === vessel.id ? null : vessel.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                  {openDropdownId === vessel.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                      <button
                        onClick={() => {
                          handleEdit(vessel);
                          setOpenDropdownId(null);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Vessel
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(vessel.id);
                          setOpenDropdownId(null);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Vessel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium">{vessel.vesselType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Flag</p>
                  <p className="text-sm font-medium">{vessel.flag}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Year Built</p>
                  <p className="text-sm font-medium">{vessel.yearBuilt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gross Tonnage</p>
                  <p className="text-sm font-medium">{vessel.grossTonnage.toLocaleString()} GT</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vessel.onboardingStatus)}`}>
                    {getStatusIcon(vessel.onboardingStatus)}
                    <span className="ml-1">{vessel.onboardingStatus.replace('_', ' ')}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {vessel.onboardingProgress}% complete
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${vessel.onboardingProgress}%` }}
                  />
                </div>

                {vessel.assignedManagers && vessel.assignedManagers.length > 0 && (
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Managed by {vessel.assignedManagers.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && vesselsData && vesselsData.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {vesselsData.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(vesselsData.pagination.totalPages, p + 1))}
            disabled={currentPage === vesselsData.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !isError && filteredVessels.length === 0 && (
        <div className="text-center py-12">
          <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No vessels found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first vessel'}
          </p>
        </div>
      )}

      {/* Add/Edit Vessel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingVessel ? 'Edit Vessel' : 'Add New Vessel'}
            </h2>
            
            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 px-1 ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                Vessel Details
              </button>
              <button
                onClick={() => setActiveTab('engine')}
                className={`pb-2 px-1 ${activeTab === 'engine' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                Engine Information
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`pb-2 px-1 ${activeTab === 'assignments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                Assignments
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Vessel Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vesselName">Vessel Name</Label>
                    <Input
                      id="vesselName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="MV Example Ship"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="imoNumber">IMO Number</Label>
                    <Input
                      id="imoNumber"
                      value={formData.imoNumber}
                      onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                      placeholder="1234567"
                      pattern="[0-9]{7}"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vesselType">Vessel Type</Label>
                      <select
                        id="vesselType"
                        value={formData.vesselType}
                        onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="container_ship">Container Ship</option>
                        <option value="bulk_carrier">Bulk Carrier</option>
                        <option value="tanker">Tanker</option>
                        <option value="general_cargo">General Cargo</option>
                        <option value="passenger_ship">Passenger Ship</option>
                        <option value="offshore_vessel">Offshore Vessel</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="flag">Flag State</Label>
                      <Input
                        id="flag"
                        value={formData.flag}
                        onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                        placeholder="United States"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        value={formData.yearBuilt}
                        onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
                        min="1900"
                        max={new Date().getFullYear()}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="grossTonnage">Gross Tonnage</Label>
                      <Input
                        id="grossTonnage"
                        type="number"
                        value={formData.grossTonnage}
                        onChange={(e) => setFormData({ ...formData, grossTonnage: parseInt(e.target.value) })}
                        min="0"
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deadWeight">Dead Weight (DWT)</Label>
                      <Input
                        id="deadWeight"
                        type="number"
                        value={formData.deadWeight}
                        onChange={(e) => setFormData({ ...formData, deadWeight: parseInt(e.target.value) })}
                        min="0"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Engine Information Tab */}
              {activeTab === 'engine' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Main Engine</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mainManufacturer">Manufacturer</Label>
                        <Input
                          id="mainManufacturer"
                          value={formData.mainEngine.manufacturer}
                          onChange={(e) => setFormData({
                            ...formData,
                            mainEngine: { ...formData.mainEngine, manufacturer: e.target.value }
                          })}
                          placeholder="MAN B&W"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mainModel">Model</Label>
                        <Input
                          id="mainModel"
                          value={formData.mainEngine.model}
                          onChange={(e) => setFormData({
                            ...formData,
                            mainEngine: { ...formData.mainEngine, model: e.target.value }
                          })}
                          placeholder="6S70ME-C"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mainPower">Power (kW)</Label>
                        <Input
                          id="mainPower"
                          type="number"
                          value={formData.mainEngine.power}
                          onChange={(e) => setFormData({
                            ...formData,
                            mainEngine: { ...formData.mainEngine, power: parseInt(e.target.value) }
                          })}
                          min="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mainRpm">RPM</Label>
                        <Input
                          id="mainRpm"
                          type="number"
                          value={formData.mainEngine.rpm}
                          onChange={(e) => setFormData({
                            ...formData,
                            mainEngine: { ...formData.mainEngine, rpm: parseInt(e.target.value) }
                          })}
                          min="0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Auxiliary Engines</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addAuxiliaryEngine}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Engine
                      </Button>
                    </div>
                    
                    {formData.auxiliaryEngines.map((engine, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-3">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium">Auxiliary Engine {index + 1}</h4>
                          {formData.auxiliaryEngines.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAuxiliaryEngine(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`auxManufacturer${index}`}>Manufacturer</Label>
                            <Input
                              id={`auxManufacturer${index}`}
                              value={engine.manufacturer}
                              onChange={(e) => {
                                const newEngines = [...formData.auxiliaryEngines];
                                newEngines[index].manufacturer = e.target.value;
                                setFormData({ ...formData, auxiliaryEngines: newEngines });
                              }}
                              placeholder="Caterpillar"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`auxModel${index}`}>Model</Label>
                            <Input
                              id={`auxModel${index}`}
                              value={engine.model}
                              onChange={(e) => {
                                const newEngines = [...formData.auxiliaryEngines];
                                newEngines[index].model = e.target.value;
                                setFormData({ ...formData, auxiliaryEngines: newEngines });
                              }}
                              placeholder="C32"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`auxPower${index}`}>Power (kW)</Label>
                            <Input
                              id={`auxPower${index}`}
                              type="number"
                              value={engine.power}
                              onChange={(e) => {
                                const newEngines = [...formData.auxiliaryEngines];
                                newEngines[index].power = parseInt(e.target.value);
                                setFormData({ ...formData, auxiliaryEngines: newEngines });
                              }}
                              min="0"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`auxQuantity${index}`}>Quantity</Label>
                            <Input
                              id={`auxQuantity${index}`}
                              type="number"
                              value={engine.quantity}
                              onChange={(e) => {
                                const newEngines = [...formData.auxiliaryEngines];
                                newEngines[index].quantity = parseInt(e.target.value);
                                setFormData({ ...formData, auxiliaryEngines: newEngines });
                              }}
                              min="1"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      Assign managers and technicians to this vessel after creation. 
                      Use the Team Structure Builder to manage assignments.
                    </p>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3" />
                    <p>No assignments yet</p>
                    <p className="text-sm mt-1">Save the vessel first to assign team members</p>
                  </div>
                </div>
              )}
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingVessel ? 'Update' : 'Create'} Vessel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};