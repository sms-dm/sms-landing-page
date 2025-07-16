import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Equipment, EquipmentCategory, CriticalityLevel, EquipmentStatus, EquipmentClassification } from '@/types';
import { OnboardingFlowState } from '../types';
import { technicianApi } from '../services/technicianApi';
import { PhotoCapture } from './PhotoCapture';
import { offlineService } from '../services/offlineService';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle } from 'lucide-react';

interface EquipmentFormProps {
  locationId: string;
  onComplete: (equipment: Equipment) => void;
  flowState: OnboardingFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<OnboardingFlowState>>;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  locationId,
  onComplete,
  flowState,
  setFlowState,
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    criticalityLevel: CriticalityLevel.MEDIUM,
    classification: EquipmentClassification.PERMANENT,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEquipment();
    loadCategories();
  }, [locationId]);

  const loadEquipment = async () => {
    try {
      const data = await technicianApi.getLocationEquipment(locationId);
      setEquipment(data);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    }
  };

  const loadCategories = async () => {
    // TODO: Load from API
    setCategories([
      {
        id: '1',
        name: 'Main Engine',
        code: 'ME',
        description: 'Main propulsion engine',
        subcategories: [],
        requiredFields: ['manufacturer', 'model', 'serialNumber'],
        icon: 'engine',
      },
      {
        id: '2',
        name: 'Auxiliary Engine',
        code: 'AE',
        description: 'Auxiliary power generation',
        subcategories: [],
        requiredFields: ['manufacturer', 'model', 'serialNumber'],
        icon: 'power',
      },
      {
        id: '3',
        name: 'Pumps',
        code: 'PMP',
        description: 'Various pumps',
        subcategories: [],
        requiredFields: ['manufacturer', 'model', 'type'],
        icon: 'pump',
      },
    ]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Equipment name is required';
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.serialNumber) newErrors.serialNumber = 'Serial number is required';
    if (!selectedCategory) newErrors.category = 'Category is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const equipmentData: Equipment = {
        id: uuidv4(),
        vesselId: flowState.vesselId,
        categoryId: selectedCategory,
        ...formData,
        classification: formData.classification,
        specifications: {},
        documentation: [],
        spareParts: [],
        qualityScore: 0,
        status: EquipmentStatus.DRAFT,
        createdBy: 'current-user', // TODO: Get from auth
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (navigator.onLine) {
        const created = await technicianApi.createEquipment(locationId, equipmentData);
        onComplete(created);
      } else {
        // Save offline
        await offlineService.saveOfflineData({
          id: equipmentData.id,
          type: 'equipment',
          action: 'create',
          data: { ...equipmentData, locationId },
          timestamp: new Date(),
          synced: false,
        });
        onComplete(equipmentData);
      }
    } catch (err) {
      console.error('Failed to create equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCriticalityColor = (level: CriticalityLevel) => {
    switch (level) {
      case CriticalityLevel.CRITICAL:
        return 'text-red-600 bg-red-50';
      case CriticalityLevel.HIGH:
        return 'text-orange-600 bg-orange-50';
      case CriticalityLevel.MEDIUM:
        return 'text-yellow-600 bg-yellow-50';
      case CriticalityLevel.LOW:
        return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Equipment</h2>
        
        {/* Existing equipment list */}
        {equipment.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Existing Equipment at this Location</h3>
            <div className="space-y-2">
              {equipment.map((eq) => (
                <Card key={eq.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-sm text-gray-600">
                        {eq.manufacturer} - {eq.model}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getCriticalityColor(eq.criticalityLevel)}`}>
                      {eq.criticalityLevel}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add new equipment form */}
        <Card className="p-6">
          <h3 className="font-medium mb-4">New Equipment Details</h3>
          
          <div className="grid gap-4">
            {/* Category selection */}
            <div>
              <Label htmlFor="category">Equipment Category *</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">{errors.category}</p>
              )}
            </div>

            {/* Equipment details */}
            <div>
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Engine #1"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., MAN B&W"
                />
                {errors.manufacturer && (
                  <p className="text-sm text-red-600 mt-1">{errors.manufacturer}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., 6S60MC-C"
                />
                {errors.model && (
                  <p className="text-sm text-red-600 mt-1">{errors.model}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="e.g., 12345-ABC"
              />
              {errors.serialNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.serialNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Specific Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Port side, Frame 45-50"
              />
            </div>

            {/* Equipment Classification */}
            <div>
              <Label>Equipment Classification *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.values(EquipmentClassification).map((classification) => (
                  <button
                    key={classification}
                    type="button"
                    onClick={() => setFormData({ ...formData, classification })}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      formData.classification === classification
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {classification.charAt(0).toUpperCase() + classification.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Equipment Classifications:</p>
                  <ul className="space-y-1">
                    <li><span className="font-medium">Permanent:</span> Fixed equipment that stays with the vessel</li>
                    <li><span className="font-medium">Floating:</span> Equipment that can be transferred between vessels</li>
                    <li><span className="font-medium">Rental:</span> Rented equipment that may be returned or moved</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Criticality Level */}
            <div>
              <Label>Criticality Level *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.values(CriticalityLevel).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, criticalityLevel: level })}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      formData.criticalityLevel === level
                        ? getCriticalityColor(level)
                        : 'border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Mark equipment as "Critical" if failure would affect vessel operation or safety
                </p>
              </div>
            </div>

            {/* Photo capture */}
            <div>
              <Label>Equipment Photos</Label>
              <div className="mt-2">
                <PhotoCapture
                  entityType="equipment"
                  entityId={formData.serialNumber || 'new'}
                  onPhotoAdded={(url) => console.log('Photo added:', url)}
                  flowState={flowState}
                  setFlowState={setFlowState}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onComplete(equipment[0])}
              disabled={equipment.length === 0}
            >
              Skip
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Add & Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};