import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Equipment } from '../services/equipmentApi';
import { EquipmentStatus, CriticalLevel } from '@/types';
import { MoreHorizontal, Edit, Trash, UserPlus, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import EquipmentPartsDialog from './EquipmentPartsDialog';

interface Props {
  equipment: Equipment[];
  loading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
}

const statusColors = {
  [EquipmentStatus.PLANNED]: 'bg-blue-100 text-blue-700',
  [EquipmentStatus.ARRIVING]: 'bg-purple-100 text-purple-700',
  [EquipmentStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [EquipmentStatus.PENDING_REVIEW]: 'bg-yellow-100 text-yellow-700',
  [EquipmentStatus.VERIFIED]: 'bg-indigo-100 text-indigo-700',
  [EquipmentStatus.APPROVED]: 'bg-green-100 text-green-700',
  [EquipmentStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [EquipmentStatus.REMOVED]: 'bg-red-100 text-red-700',
  [EquipmentStatus.REJECTED]: 'bg-red-100 text-red-700',
};

const criticalityColors = {
  [CriticalLevel.CRITICAL]: 'bg-red-100 text-red-700',
  [CriticalLevel.HIGH]: 'bg-orange-100 text-orange-700',
  [CriticalLevel.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [CriticalLevel.LOW]: 'bg-green-100 text-green-700',
};

export default function EquipmentTable({
  equipment,
  loading,
  selectedIds,
  onSelectionChange,
  pagination,
  onPageChange
}: Props) {
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [selectedEquipmentForParts, setSelectedEquipmentForParts] = useState<Equipment | null>(null);
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(equipment.map(e => e.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = equipment.length > 0 && selectedIds.length === equipment.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < equipment.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isPartiallySelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Vessel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Quality Score</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.manufacturer} {item.model}
                      {item.serialNumber && ` - ${item.serialNumber}`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{item.vessel?.name}</div>
                    {item.vessel?.imoNumber && (
                      <div className="text-muted-foreground">IMO: {item.vessel.imoNumber}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.equipmentType || '-'}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${criticalityColors[item.criticality]}`}>
                    {item.criticality}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  {item.documentedByUser ? (
                    <div className="text-sm">
                      <div>{item.documentedByUser.firstName} {item.documentedByUser.lastName}</div>
                      <div className="text-muted-foreground">{item.documentedByUser.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.qualityScore >= 80 ? 'bg-green-600' :
                          item.qualityScore >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${item.qualityScore}%` }}
                      />
                    </div>
                    <span className="text-sm">{item.qualityScore}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedEquipmentForParts(item);
                          setPartsDialogOpen(true);
                        }}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Manage Parts
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
            {pagination.totalItems} equipment
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Parts Management Dialog */}
      <EquipmentPartsDialog
        open={partsDialogOpen}
        onClose={() => {
          setPartsDialogOpen(false);
          setSelectedEquipmentForParts(null);
        }}
        equipment={selectedEquipmentForParts}
      />
    </div>
  );
}