import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBulkUpdateEquipmentMutation,
  useBulkDeleteEquipmentMutation,
  useAssignEquipmentMutation
} from '../services/equipmentApi';
import { useGetTeamMembersQuery } from '../services/managerApi';
import { EquipmentStatus, CriticalLevel } from '@/types';
import { X, UserPlus, Edit, Trash, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

interface Props {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
}

export default function BulkOperationsBar({ selectedCount, selectedIds, onClearSelection }: Props) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCriticality, setSelectedCriticality] = useState('');

  const { data: teamMembers } = useGetTeamMembersQuery();
  const [bulkUpdate] = useBulkUpdateEquipmentMutation();
  const [bulkDelete] = useBulkDeleteEquipmentMutation();
  const [assignEquipment] = useAssignEquipmentMutation();

  const handleBulkStatusUpdate = async () => {
    if (!selectedStatus) return;

    try {
      const result = await bulkUpdate({
        equipmentIds: selectedIds,
        updates: { status: selectedStatus as EquipmentStatus }
      }).unwrap();

      toast({
        title: 'Success',
        description: `Updated ${result.data?.count} equipment items`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update equipment',
        variant: 'destructive',
      });
    }
  };

  const handleBulkCriticalityUpdate = async () => {
    if (!selectedCriticality) return;

    try {
      const result = await bulkUpdate({
        equipmentIds: selectedIds,
        updates: { criticality: selectedCriticality as CriticalLevel }
      }).unwrap();

      toast({
        title: 'Success',
        description: `Updated ${result.data?.count} equipment items`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update equipment',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee) return;

    try {
      const result = await assignEquipment({
        equipmentIds: selectedIds,
        assignToId: selectedAssignee
      }).unwrap();

      toast({
        title: 'Success',
        description: `Assigned ${result.data?.count} equipment items to ${result.data?.assignee.firstName} ${result.data?.assignee.lastName}`,
      });
      onClearSelection();
      setShowAssignDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign equipment',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedCount} equipment items?`)) return;

    try {
      const result = await bulkDelete(selectedIds).unwrap();
      toast({
        title: 'Success',
        description: `Removed ${result.data?.count} equipment items`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove equipment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">{selectedCount} items selected</span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Update */}
          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EquipmentStatus.PLANNED}>Planned</SelectItem>
                <SelectItem value={EquipmentStatus.ARRIVING}>Arriving</SelectItem>
                <SelectItem value={EquipmentStatus.PENDING_REVIEW}>Pending Review</SelectItem>
                <SelectItem value={EquipmentStatus.VERIFIED}>Verified</SelectItem>
                <SelectItem value={EquipmentStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={EquipmentStatus.ACTIVE}>Active</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleBulkStatusUpdate}
              disabled={!selectedStatus}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>

          {/* Criticality Update */}
          <div className="flex items-center gap-2">
            <Select value={selectedCriticality} onValueChange={setSelectedCriticality}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CriticalLevel.CRITICAL}>Critical</SelectItem>
                <SelectItem value={CriticalLevel.HIGH}>High</SelectItem>
                <SelectItem value={CriticalLevel.MEDIUM}>Medium</SelectItem>
                <SelectItem value={CriticalLevel.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleBulkCriticalityUpdate}
              disabled={!selectedCriticality}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>

          {/* Assign */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAssignDialog(!showAssignDialog)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
          >
            <Trash className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>

      {/* Assign Dialog */}
      {showAssignDialog && (
        <div className="mt-4 p-4 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Assign to technician or self</label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.data?.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkAssign} disabled={!selectedAssignee}>
              Assign Equipment
            </Button>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}