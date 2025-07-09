import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBulkCreateEquipmentMutation } from '../services/equipmentApi';
import { useGetVesselsNeedingOnboardingQuery } from '../services/managerApi';
import { EquipmentType, EquipmentStatus, CriticalLevel } from '@/types';
import { toast } from '@/utils/toast';
import { Plus, Trash } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface EquipmentFormData {
  name: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  criticality: CriticalLevel;
  status: EquipmentStatus;
  installationDate?: string;
}

const defaultEquipment: EquipmentFormData = {
  name: '',
  type: EquipmentType.OTHER,
  manufacturer: '',
  model: '',
  serialNumber: '',
  criticality: CriticalLevel.MEDIUM,
  status: EquipmentStatus.PLANNED,
  installationDate: ''
};

export default function AddEquipmentDialog({ open, onClose }: Props) {
  const [vesselId, setVesselId] = useState('');
  const [equipmentList, setEquipmentList] = useState<EquipmentFormData[]>([{ ...defaultEquipment }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: vessels } = useGetVesselsNeedingOnboardingQuery();
  const [bulkCreate] = useBulkCreateEquipmentMutation();

  const handleAddEquipment = () => {
    setEquipmentList([...equipmentList, { ...defaultEquipment }]);
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const handleEquipmentChange = (index: number, field: keyof EquipmentFormData, value: string) => {
    const updated = [...equipmentList];
    updated[index] = { ...updated[index], [field]: value };
    setEquipmentList(updated);
  };

  const handleSubmit = async () => {
    if (!vesselId) {
      toast({
        title: 'Error',
        description: 'Please select a vessel',
        variant: 'destructive',
      });
      return;
    }

    const invalidEquipment = equipmentList.findIndex(eq => 
      !eq.name || !eq.manufacturer || !eq.model
    );

    if (invalidEquipment !== -1) {
      toast({
        title: 'Error',
        description: `Please fill in all required fields for equipment ${invalidEquipment + 1}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkCreate({
        vesselId,
        equipment: equipmentList
      }).unwrap();

      toast({
        title: 'Success',
        description: `Created ${result.data?.count} equipment items`,
      });
      onClose();
      // Reset form
      setVesselId('');
      setEquipmentList([{ ...defaultEquipment }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create equipment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
          <DialogDescription>
            Add one or more equipment items to a vessel. You can pre-add equipment before arrival.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vessel Selection */}
          <div>
            <Label htmlFor="vessel">Vessel *</Label>
            <Select value={vesselId} onValueChange={setVesselId}>
              <SelectTrigger id="vessel">
                <SelectValue placeholder="Select a vessel" />
              </SelectTrigger>
              <SelectContent>
                {vessels?.data?.map(vessel => (
                  <SelectItem key={vessel.id} value={vessel.id}>
                    {vessel.name} {vessel.imoNumber && `(IMO: ${vessel.imoNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipment List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Equipment Items</h3>
              <Button variant="outline" size="sm" onClick={handleAddEquipment}>
                <Plus className="h-4 w-4 mr-1" />
                Add Another
              </Button>
            </div>

            {equipmentList.map((equipment, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Equipment {index + 1}</h4>
                  {equipmentList.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEquipment(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Name *</Label>
                    <Input
                      id={`name-${index}`}
                      value={equipment.name}
                      onChange={(e) => handleEquipmentChange(index, 'name', e.target.value)}
                      placeholder="Equipment name"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`type-${index}`}>Type *</Label>
                    <Select 
                      value={equipment.type} 
                      onValueChange={(value) => handleEquipmentChange(index, 'type', value as EquipmentType)}
                    >
                      <SelectTrigger id={`type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EquipmentType.MAIN_ENGINE}>Main Engine</SelectItem>
                        <SelectItem value={EquipmentType.AUXILIARY_ENGINE}>Auxiliary Engine</SelectItem>
                        <SelectItem value={EquipmentType.PUMP}>Pump</SelectItem>
                        <SelectItem value={EquipmentType.COMPRESSOR}>Compressor</SelectItem>
                        <SelectItem value={EquipmentType.GENERATOR}>Generator</SelectItem>
                        <SelectItem value={EquipmentType.NAVIGATION}>Navigation</SelectItem>
                        <SelectItem value={EquipmentType.SAFETY}>Safety</SelectItem>
                        <SelectItem value={EquipmentType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`manufacturer-${index}`}>Manufacturer *</Label>
                    <Input
                      id={`manufacturer-${index}`}
                      value={equipment.manufacturer}
                      onChange={(e) => handleEquipmentChange(index, 'manufacturer', e.target.value)}
                      placeholder="Manufacturer name"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`model-${index}`}>Model *</Label>
                    <Input
                      id={`model-${index}`}
                      value={equipment.model}
                      onChange={(e) => handleEquipmentChange(index, 'model', e.target.value)}
                      placeholder="Model number"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`serial-${index}`}>Serial Number</Label>
                    <Input
                      id={`serial-${index}`}
                      value={equipment.serialNumber}
                      onChange={(e) => handleEquipmentChange(index, 'serialNumber', e.target.value)}
                      placeholder="Serial number (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`criticality-${index}`}>Criticality *</Label>
                    <Select 
                      value={equipment.criticality} 
                      onValueChange={(value) => handleEquipmentChange(index, 'criticality', value as CriticalLevel)}
                    >
                      <SelectTrigger id={`criticality-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CriticalLevel.CRITICAL}>Critical</SelectItem>
                        <SelectItem value={CriticalLevel.HIGH}>High</SelectItem>
                        <SelectItem value={CriticalLevel.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={CriticalLevel.LOW}>Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`status-${index}`}>Status *</Label>
                    <Select 
                      value={equipment.status} 
                      onValueChange={(value) => handleEquipmentChange(index, 'status', value as EquipmentStatus)}
                    >
                      <SelectTrigger id={`status-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EquipmentStatus.PLANNED}>Planned</SelectItem>
                        <SelectItem value={EquipmentStatus.ARRIVING}>Arriving</SelectItem>
                        <SelectItem value={EquipmentStatus.DRAFT}>Draft</SelectItem>
                        <SelectItem value={EquipmentStatus.ACTIVE}>Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`installation-${index}`}>Installation Date</Label>
                    <Input
                      id={`installation-${index}`}
                      type="date"
                      value={equipment.installationDate}
                      onChange={(e) => handleEquipmentChange(index, 'installationDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : `Create ${equipmentList.length} Equipment Item${equipmentList.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}