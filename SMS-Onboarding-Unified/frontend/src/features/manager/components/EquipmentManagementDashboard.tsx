import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import { useListManagerEquipmentQuery, useGetEquipmentStatsQuery } from '../services/equipmentApi';
import { EquipmentStatus, CriticalLevel } from '@/types';
import EquipmentTable from './EquipmentTable';
import EquipmentStats from './EquipmentStats';
import AddEquipmentDialog from './AddEquipmentDialog';
import BulkOperationsBar from './BulkOperationsBar';
import { Plus, Download, Upload } from 'lucide-react';

export default function EquipmentManagementDashboard() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    criticalLevel: '',
    vesselId: '',
    assignedTo: '',
    page: 1,
    limit: 20
  });

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: equipmentData, isLoading } = useListManagerEquipmentQuery(filters);
  const { data: statsData } = useGetEquipmentStatsQuery({ vesselId: filters.vesselId });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedEquipment(ids);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting equipment data...');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Importing equipment data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">
            Manage vessel equipment, assign onboarding tasks, and track equipment status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statsData?.data && <EquipmentStats stats={statsData.data} />}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search equipment..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value={EquipmentStatus.PLANNED}>Planned</SelectItem>
                <SelectItem value={EquipmentStatus.ARRIVING}>Arriving</SelectItem>
                <SelectItem value={EquipmentStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={EquipmentStatus.PENDING_REVIEW}>Pending Review</SelectItem>
                <SelectItem value={EquipmentStatus.VERIFIED}>Verified</SelectItem>
                <SelectItem value={EquipmentStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={EquipmentStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={EquipmentStatus.REMOVED}>Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="criticality">Criticality</Label>
            <Select value={filters.criticalLevel} onValueChange={(value) => handleFilterChange('criticalLevel', value)}>
              <SelectTrigger id="criticality">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All levels</SelectItem>
                <SelectItem value={CriticalLevel.CRITICAL}>Critical</SelectItem>
                <SelectItem value={CriticalLevel.HIGH}>High</SelectItem>
                <SelectItem value={CriticalLevel.MEDIUM}>Medium</SelectItem>
                <SelectItem value={CriticalLevel.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vessel">Vessel</Label>
            <Select value={filters.vesselId} onValueChange={(value) => handleFilterChange('vesselId', value)}>
              <SelectTrigger id="vessel">
                <SelectValue placeholder="All vessels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All vessels</SelectItem>
                {/* TODO: Add vessel options dynamically */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignee">Assigned To</Label>
            <Select value={filters.assignedTo} onValueChange={(value) => handleFilterChange('assignedTo', value)}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All assignees</SelectItem>
                {/* TODO: Add assignee options dynamically */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Operations */}
      {selectedEquipment.length > 0 && (
        <BulkOperationsBar
          selectedCount={selectedEquipment.length}
          selectedIds={selectedEquipment}
          onClearSelection={() => setSelectedEquipment([])}
        />
      )}

      {/* Equipment Table */}
      <EquipmentTable
        equipment={equipmentData?.data || []}
        loading={isLoading}
        selectedIds={selectedEquipment}
        onSelectionChange={handleSelectionChange}
        pagination={equipmentData?.pagination}
        onPageChange={handlePageChange}
      />

      {/* Add Equipment Dialog */}
      <AddEquipmentDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  );
}