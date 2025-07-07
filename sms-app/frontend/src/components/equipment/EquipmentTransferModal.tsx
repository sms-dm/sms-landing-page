import React, { useState, useEffect } from 'react';
import { Equipment, Vessel } from '../../types';

interface TransferModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (data: TransferData) => void;
}

interface TransferData {
  equipmentId: number;
  toVesselId: number;
  toLocation: string;
  reason: string;
  notes: string;
}

export default function EquipmentTransferModal({ equipment, isOpen, onClose, onTransfer }: TransferModalProps) {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && equipment) {
      fetchVessels();
    }
  }, [isOpen, equipment]);

  const fetchVessels = async () => {
    try {
      const response = await fetch('/api/companies/vessels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out current vessel
        const availableVessels = data.filter((v: Vessel) => v.id !== equipment?.vessel_id);
        setVessels(availableVessels);
      }
    } catch (err) {
      console.error('Failed to fetch vessels:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipment || !selectedVesselId || !reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onTransfer({
        equipmentId: equipment.id,
        toVesselId: parseInt(selectedVesselId),
        toLocation: toLocation.trim() || 'To be assigned',
        reason: reason.trim(),
        notes: notes.trim()
      });
      
      // Reset form
      setSelectedVesselId('');
      setToLocation('');
      setReason('');
      setNotes('');
      onClose();
    } catch (err) {
      setError('Failed to transfer equipment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) return null;

  const canTransfer = equipment.classification && equipment.classification !== 'PERMANENT';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Transfer Equipment</h2>
        
        {!canTransfer ? (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">
                This equipment is classified as <strong>Permanent</strong> and cannot be transferred.
                Only <strong>Temporary</strong> or <strong>Rental</strong> equipment can be transferred between vessels.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4 bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Equipment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-600">Name:</span> {equipment.name}</div>
                <div><span className="text-gray-600">QR Code:</span> {equipment.qr_code}</div>
                <div><span className="text-gray-600">Manufacturer:</span> {equipment.manufacturer}</div>
                <div><span className="text-gray-600">Model:</span> {equipment.model}</div>
                <div>
                  <span className="text-gray-600">Classification:</span>{' '}
                  <span className={`font-medium ${
                    equipment.classification === 'TEMPORARY' ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {equipment.classification}
                  </span>
                </div>
                <div><span className="text-gray-600">Current Location:</span> {equipment.location}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Vessel <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVesselId}
                onChange={(e) => setSelectedVesselId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a vessel</option>
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name} ({vessel.imo_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Location
              </label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                placeholder="e.g., Engine Room, Main Deck"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Transfer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Vessel maintenance, Equipment reallocation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about the transfer"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                All equipment history, maintenance logs, and documents will be preserved during the transfer.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading || !selectedVesselId || !reason.trim()}
              >
                {loading ? 'Transferring...' : 'Transfer Equipment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}