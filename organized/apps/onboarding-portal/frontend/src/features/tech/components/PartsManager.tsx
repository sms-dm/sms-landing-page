import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SparePart, CriticalityLevel } from '@/types';
import { OnboardingFlowState } from '../types';
import { technicianApi } from '../services/technicianApi';
import { PhotoCapture } from './PhotoCapture';
import { offlineService } from '../services/offlineService';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, Check, Plus, X } from 'lucide-react';

interface PartsManagerProps {
  equipmentId: string;
  onComplete: () => void;
  flowState: OnboardingFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<OnboardingFlowState>>;
}

export const PartsManager: React.FC<PartsManagerProps> = ({
  equipmentId,
  onComplete,
  flowState,
  setFlowState,
}) => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    manufacturer: '',
    description: '',
    quantity: 0,
    minimumStock: 0,
    location: '',
    criticalityLevel: CriticalityLevel.MEDIUM,
  });
  const [markingCritical, setMarkingCritical] = useState<string | null>(null);
  const [criticalReason, setCriticalReason] = useState('');

  useEffect(() => {
    loadParts();
  }, [equipmentId]);

  const loadParts = async () => {
    try {
      const data = await technicianApi.getEquipmentParts(equipmentId);
      setParts(data);
    } catch (err) {
      console.error('Failed to load parts:', err);
    }
  };

  const handleAddPart = async () => {
    try {
      setLoading(true);
      const partData: SparePart = {
        id: uuidv4(),
        equipmentId,
        ...formData,
        suppliers: [],
        images: [],
        estimatedLeadTime: 0,
      };

      if (navigator.onLine) {
        const created = await technicianApi.createSparePart(equipmentId, partData);
        setParts([...parts, created]);
      } else {
        // Save offline
        await offlineService.saveOfflineData({
          id: partData.id,
          type: 'part',
          action: 'create',
          data: partData,
          timestamp: new Date(),
          synced: false,
        });
        setParts([...parts, partData]);
      }

      // Reset form
      setFormData({
        partNumber: '',
        name: '',
        manufacturer: '',
        description: '',
        quantity: 0,
        minimumStock: 0,
        location: '',
        criticalityLevel: CriticalityLevel.MEDIUM,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add part:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCritical = async (partId: string) => {
    if (!criticalReason.trim()) return;

    try {
      if (navigator.onLine) {
        const updated = await technicianApi.markPartAsCritical(partId, criticalReason);
        setParts(parts.map(p => p.id === partId ? updated : p));
      } else {
        // Update locally and queue for sync
        setParts(parts.map(p => 
          p.id === partId 
            ? { ...p, criticalityLevel: CriticalityLevel.CRITICAL }
            : p
        ));
        
        await offlineService.saveOfflineData({
          id: `critical-${partId}`,
          type: 'part',
          action: 'update',
          data: { 
            id: partId, 
            criticalityLevel: CriticalityLevel.CRITICAL,
            criticalReason 
          },
          timestamp: new Date(),
          synced: false,
        });
      }
      
      setMarkingCritical(null);
      setCriticalReason('');
    } catch (err) {
      console.error('Failed to mark as critical:', err);
    }
  };

  const getCriticalityColor = (level: CriticalityLevel) => {
    switch (level) {
      case CriticalityLevel.CRITICAL:
        return 'border-red-500 bg-red-50';
      case CriticalityLevel.HIGH:
        return 'border-orange-500 bg-orange-50';
      case CriticalityLevel.MEDIUM:
        return 'border-yellow-500 bg-yellow-50';
      case CriticalityLevel.LOW:
        return 'border-green-500 bg-green-50';
    }
  };

  const getCriticalityTextColor = (level: CriticalityLevel) => {
    switch (level) {
      case CriticalityLevel.CRITICAL:
        return 'text-red-700';
      case CriticalityLevel.HIGH:
        return 'text-orange-700';
      case CriticalityLevel.MEDIUM:
        return 'text-yellow-700';
      case CriticalityLevel.LOW:
        return 'text-green-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Spare Parts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add spare parts and identify critical components
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Part
        </Button>
      </div>

      {/* Critical parts alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Identify Critical Parts</p>
            <p className="text-sm text-amber-700 mt-1">
              Mark parts as critical if their failure would impact vessel operation, 
              safety, or require immediate replacement
            </p>
          </div>
        </div>
      </div>

      {/* Add part form */}
      {showAddForm && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Add New Spare Part</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="e.g., 12345-ABC"
                />
              </div>
              <div>
                <Label htmlFor="name">Part Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Oil Filter"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Mann Filter"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="minimumStock">Minimum Stock</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Store Room A, Shelf 3"
              />
            </div>

            <div>
              <Label>Criticality Level</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.values(CriticalityLevel).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, criticalityLevel: level })}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      formData.criticalityLevel === level
                        ? getCriticalityColor(level) + ' ' + getCriticalityTextColor(level)
                        : 'border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddPart}
              disabled={loading || !formData.partNumber || !formData.name}
            >
              {loading ? 'Adding...' : 'Add Part'}
            </Button>
          </div>
        </Card>
      )}

      {/* Parts list */}
      <div className="space-y-3">
        {parts.map((part) => (
          <Card key={part.id} className={`p-4 border-2 ${getCriticalityColor(part.criticalityLevel)}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{part.name}</h4>
                  <span className={`text-sm font-medium ${getCriticalityTextColor(part.criticalityLevel)}`}>
                    {part.criticalityLevel}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <p>Part #: {part.partNumber}</p>
                  <p>Manufacturer: {part.manufacturer || 'N/A'}</p>
                  <p>Quantity: {part.quantity} (Min: {part.minimumStock})</p>
                  <p>Location: {part.location || 'Not specified'}</p>
                </div>
                {part.description && (
                  <p className="text-sm text-gray-500 mt-2">{part.description}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <PhotoCapture
                  entityType="part"
                  entityId={part.id}
                  onPhotoAdded={(url) => console.log('Photo added:', url)}
                  flowState={flowState}
                  setFlowState={setFlowState}
                  className="text-sm"
                />
                
                {part.criticalityLevel !== CriticalityLevel.CRITICAL && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMarkingCritical(part.id)}
                    className="text-xs"
                  >
                    Mark Critical
                  </Button>
                )}
              </div>
            </div>

            {/* Critical marking dialog */}
            {markingCritical === part.id && (
              <div className="mt-4 p-3 bg-white rounded-md border">
                <Label htmlFor={`reason-${part.id}`}>Why is this part critical?</Label>
                <Input
                  id={`reason-${part.id}`}
                  value={criticalReason}
                  onChange={(e) => setCriticalReason(e.target.value)}
                  placeholder="e.g., Essential for main engine operation"
                  className="mt-2"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleMarkCritical(part.id)}
                    disabled={!criticalReason.trim()}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMarkingCritical(null);
                      setCriticalReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Low stock warning */}
            {part.quantity <= part.minimumStock && (
              <div className="mt-3 text-sm text-orange-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Low stock - reorder recommended
              </div>
            )}
          </Card>
        ))}
      </div>

      {parts.length === 0 && !showAddForm && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No spare parts added yet</p>
          <Button onClick={() => setShowAddForm(true)}>Add First Part</Button>
        </Card>
      )}

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onComplete}
          className="flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Continue to Review
        </Button>
      </div>
    </div>
  );
};