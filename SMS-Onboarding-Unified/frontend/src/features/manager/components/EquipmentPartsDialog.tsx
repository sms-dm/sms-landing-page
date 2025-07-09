import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Equipment } from '../services/equipmentApi';
import { CriticalLevel } from '@/types';
import { Plus, Package, AlertTriangle, Edit, Trash } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

interface Part {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  criticality: CriticalLevel;
  minimumStock: number;
  currentStock: number;
}

export default function EquipmentPartsDialog({ open, onClose, equipment }: Props) {
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    partNumber: '',
    manufacturer: '',
    quantity: 1,
    criticality: CriticalLevel.MEDIUM,
    minimumStock: 1,
    currentStock: 0
  });

  // Mock parts data - replace with actual API call
  const parts: Part[] = equipment?.criticalParts || [];

  const handleAddPart = () => {
    // TODO: Implement add part API call
    console.log('Adding part:', newPart);
    setShowAddPart(false);
    setNewPart({
      name: '',
      partNumber: '',
      manufacturer: '',
      quantity: 1,
      criticality: CriticalLevel.MEDIUM,
      minimumStock: 1,
      currentStock: 0
    });
  };

  const criticalityColors = {
    [CriticalLevel.CRITICAL]: 'text-red-600 bg-red-50',
    [CriticalLevel.HIGH]: 'text-orange-600 bg-orange-50',
    [CriticalLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
    [CriticalLevel.LOW]: 'text-green-600 bg-green-50',
  };

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parts Management</DialogTitle>
          <DialogDescription>
            Manage parts for {equipment.name} - {equipment.manufacturer} {equipment.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Parts Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Parts</p>
                  <p className="text-2xl font-bold">{parts.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Parts</p>
                  <p className="text-2xl font-bold text-red-600">
                    {parts.filter(p => p.criticality === CriticalLevel.CRITICAL).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {parts.filter(p => p.currentStock < p.minimumStock).length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Add Part Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowAddPart(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </div>

          {/* Add Part Form */}
          {showAddPart && (
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-medium">Add New Part</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="part-name">Part Name *</Label>
                  <Input
                    id="part-name"
                    value={newPart.name}
                    onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                    placeholder="Part name"
                  />
                </div>
                <div>
                  <Label htmlFor="part-number">Part Number *</Label>
                  <Input
                    id="part-number"
                    value={newPart.partNumber}
                    onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                    placeholder="Part number"
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={newPart.manufacturer}
                    onChange={(e) => setNewPart({ ...newPart, manufacturer: e.target.value })}
                    placeholder="Manufacturer"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="current-stock">Current Stock</Label>
                  <Input
                    id="current-stock"
                    type="number"
                    value={newPart.currentStock}
                    onChange={(e) => setNewPart({ ...newPart, currentStock: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minimum-stock">Minimum Stock</Label>
                  <Input
                    id="minimum-stock"
                    type="number"
                    value={newPart.minimumStock}
                    onChange={(e) => setNewPart({ ...newPart, minimumStock: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddPart(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPart}>
                  Add Part
                </Button>
              </div>
            </div>
          )}

          {/* Parts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No parts added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  parts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.partNumber}</TableCell>
                      <TableCell>{part.manufacturer}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${criticalityColors[part.criticality]}`}>
                          {part.criticality}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{part.currentStock} / {part.minimumStock}</div>
                          {part.currentStock < part.minimumStock && (
                            <div className="text-orange-600 text-xs">Low stock</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {part.currentStock === 0 ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                            Out of Stock
                          </span>
                        ) : part.currentStock < part.minimumStock ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            In Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}