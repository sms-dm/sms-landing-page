import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Equipment, Vessel, EquipmentClassification } from '@/types';
import { managerApi } from '../services/managerApi';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface EquipmentTransferModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EquipmentTransferModal: React.FC<EquipmentTransferModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingVessels, setLoadingVessels] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadVessels();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedVesselId) {
      loadLocations(selectedVesselId);
    }
  }, [selectedVesselId]);

  const loadVessels = async () => {
    try {
      setLoadingVessels(true);
      const data = await managerApi.getVessels();
      // Filter out the current vessel
      const availableVessels = data.filter(v => v.id !== equipment.vesselId);
      setVessels(availableVessels);
    } catch (err) {
      setError('Failed to load vessels');
    } finally {
      setLoadingVessels(false);
    }
  };

  const loadLocations = async (vesselId: string) => {
    try {
      const data = await managerApi.getVesselLocations(vesselId);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const handleTransfer = async () => {
    if (!selectedVesselId) {
      setError('Please select a destination vessel');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the transfer');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await managerApi.transferEquipment(equipment.id, {
        toVesselId: selectedVesselId,
        toLocationId: selectedLocationId || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to transfer equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedVesselId('');
    setSelectedLocationId('');
    setReason('');
    setNotes('');
    setError('');
    onClose();
  };

  const canTransfer = equipment.classification !== EquipmentClassification.PERMANENT;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Equipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!canTransfer ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                This equipment is classified as <strong>Permanent</strong> and cannot be transferred.
                Only <strong>Floating</strong> or <strong>Rental</strong> equipment can be transferred between vessels.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Equipment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Equipment Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span> {equipment.name}
                  </div>
                  <div>
                    <span className="text-gray-600">Serial Number:</span> {equipment.serialNumber}
                  </div>
                  <div>
                    <span className="text-gray-600">Manufacturer:</span> {equipment.manufacturer}
                  </div>
                  <div>
                    <span className="text-gray-600">Model:</span> {equipment.model}
                  </div>
                  <div>
                    <span className="text-gray-600">Classification:</span>{' '}
                    <span className={`font-medium ${
                      equipment.classification === EquipmentClassification.FLOATING 
                        ? 'text-blue-600' 
                        : 'text-orange-600'
                    }`}>
                      {equipment.classification.charAt(0).toUpperCase() + equipment.classification.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Location:</span> {equipment.location}
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">From Vessel</p>
                    <p className="font-medium">Current Vessel</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="toVessel">To Vessel *</Label>
                    <Select
                      value={selectedVesselId}
                      onValueChange={setSelectedVesselId}
                      disabled={loadingVessels}
                    >
                      <SelectTrigger id="toVessel">
                        <SelectValue placeholder={loadingVessels ? "Loading vessels..." : "Select destination vessel"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vessels.map((vessel) => (
                          <SelectItem key={vessel.id} value={vessel.id}>
                            {vessel.name} ({vessel.imoNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedVesselId && locations.length > 0 && (
                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Select
                      value={selectedLocationId}
                      onValueChange={setSelectedLocationId}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific location</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.path || location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="reason">Reason for Transfer *</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Vessel maintenance, Equipment reallocation"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information about the transfer"
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All equipment history, documents, parts information, and quality scores will be preserved during the transfer.
                  The equipment will be available at the destination vessel immediately after transfer.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {canTransfer && (
            <Button onClick={handleTransfer} disabled={loading || !selectedVesselId || !reason.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Transferring...' : 'Transfer Equipment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};