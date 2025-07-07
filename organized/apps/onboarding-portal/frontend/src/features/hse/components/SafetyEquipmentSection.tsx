// Safety Equipment Section Component
import React from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { SafetyEquipmentStatus, EquipmentCheck } from '../../../types';

interface SafetyEquipmentSectionProps {
  equipmentStatus: SafetyEquipmentStatus;
  onUpdate: (status: SafetyEquipmentStatus) => void;
  canEdit: boolean;
}

export const SafetyEquipmentSection: React.FC<SafetyEquipmentSectionProps> = ({
  equipmentStatus,
  onUpdate,
  canEdit
}) => {
  const equipmentItems = [
    { key: 'lifeboats', label: 'Lifeboats', icon: '🚤' },
    { key: 'lifeRafts', label: 'Life Rafts', icon: '🛟' },
    { key: 'fireExtinguishers', label: 'Fire Extinguishers', icon: '🧯' },
    { key: 'fireSuits', label: 'Fire Suits', icon: '👨‍🚒' },
    { key: 'emergencyBeacons', label: 'Emergency Beacons', icon: '📡' },
    { key: 'medicalKit', label: 'Medical Kits', icon: '🏥' },
    { key: 'gasDetectors', label: 'Gas Detectors', icon: '🔍' },
    { key: 'breathingApparatus', label: 'Breathing Apparatus', icon: '😷' }
  ];

  const updateEquipmentItem = (
    key: keyof SafetyEquipmentStatus, 
    field: keyof EquipmentCheck, 
    value: any
  ) => {
    if (!canEdit) return;
    
    const updatedStatus = {
      ...equipmentStatus,
      [key]: {
        ...(equipmentStatus[key] as EquipmentCheck),
        [field]: value
      }
    };
    onUpdate(updatedStatus);
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Safety Equipment Checklist</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {equipmentItems.map(({ key, label, icon }) => {
          const equipment = equipmentStatus[key as keyof SafetyEquipmentStatus] as EquipmentCheck;
          
          return (
            <Card key={key} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-medium">{label}</h3>
                </div>
                <Checkbox
                  checked={equipment?.available || false}
                  onChange={(e) => updateEquipmentItem(
                    key as keyof SafetyEquipmentStatus, 
                    'available', 
                    e.target.checked
                  )}
                  disabled={!canEdit}
                />
              </div>

              {equipment?.available && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}-quantity`}>Quantity</Label>
                      <Input
                        id={`${key}-quantity`}
                        type="number"
                        value={equipment.quantity || ''}
                        onChange={(e) => updateEquipmentItem(
                          key as keyof SafetyEquipmentStatus,
                          'quantity',
                          parseInt(e.target.value) || 0
                        )}
                        disabled={!canEdit}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${key}-condition`}>Condition</Label>
                      <select
                        id={`${key}-condition`}
                        value={equipment.condition || ''}
                        onChange={(e) => updateEquipmentItem(
                          key as keyof SafetyEquipmentStatus,
                          'condition',
                          e.target.value
                        )}
                        disabled={!canEdit}
                        className={`mt-1 w-full px-3 py-2 border rounded-md ${
                          canEdit ? 'bg-white' : 'bg-gray-50'
                        } ${getConditionColor(equipment.condition)}`}
                      >
                        <option value="">Select condition</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}-last-inspection`}>Last Inspection</Label>
                      <Input
                        id={`${key}-last-inspection`}
                        type="date"
                        value={equipment.lastInspection 
                          ? new Date(equipment.lastInspection).toISOString().split('T')[0]
                          : ''
                        }
                        onChange={(e) => updateEquipmentItem(
                          key as keyof SafetyEquipmentStatus,
                          'lastInspection',
                          e.target.value ? new Date(e.target.value) : undefined
                        )}
                        disabled={!canEdit}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${key}-next-inspection`}>Next Inspection</Label>
                      <Input
                        id={`${key}-next-inspection`}
                        type="date"
                        value={equipment.nextInspection 
                          ? new Date(equipment.nextInspection).toISOString().split('T')[0]
                          : ''
                        }
                        onChange={(e) => updateEquipmentItem(
                          key as keyof SafetyEquipmentStatus,
                          'nextInspection',
                          e.target.value ? new Date(e.target.value) : undefined
                        )}
                        disabled={!canEdit}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`${key}-notes`}>Notes</Label>
                    <textarea
                      id={`${key}-notes`}
                      value={equipment.notes || ''}
                      onChange={(e) => updateEquipmentItem(
                        key as keyof SafetyEquipmentStatus,
                        'notes',
                        e.target.value
                      )}
                      disabled={!canEdit}
                      rows={2}
                      className={`mt-1 w-full px-3 py-2 border rounded-md resize-none ${
                        canEdit ? 'bg-white' : 'bg-gray-50'
                      }`}
                      placeholder="Add any relevant notes..."
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Label htmlFor="additional-notes">Additional Notes</Label>
        <textarea
          id="additional-notes"
          value={equipmentStatus.additionalNotes || ''}
          onChange={(e) => onUpdate({
            ...equipmentStatus,
            additionalNotes: e.target.value
          })}
          disabled={!canEdit}
          rows={3}
          className={`mt-1 w-full px-3 py-2 border rounded-md resize-none ${
            canEdit ? 'bg-white' : 'bg-gray-50'
          }`}
          placeholder="Add any additional safety equipment notes..."
        />
      </div>
    </div>
  );
};