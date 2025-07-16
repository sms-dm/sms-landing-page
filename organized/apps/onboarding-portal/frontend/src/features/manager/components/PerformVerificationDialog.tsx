import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verificationService, EquipmentDue } from '@/services/verification';
import { useToast } from '@/utils/toast';

interface PerformVerificationDialogProps {
  equipment: EquipmentDue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PerformVerificationDialog: React.FC<PerformVerificationDialogProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationType, setVerificationType] = useState<'SCHEDULED' | 'MANUAL' | 'CORRECTIVE'>('SCHEDULED');
  const [qualityScore, setQualityScore] = useState(equipment.qualityScore);
  const [findings, setFindings] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (qualityScore < 0 || qualityScore > 100) {
      toast({
        title: 'Invalid quality score',
        description: 'Quality score must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    if (verificationType === 'CORRECTIVE' && !correctiveActions) {
      toast({
        title: 'Corrective actions required',
        description: 'Please provide corrective actions for corrective verification',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await verificationService.performVerification({
        equipmentId: equipment.id,
        verificationType,
        newQualityScore: qualityScore,
        findings: findings || undefined,
        correctiveActions: correctiveActions || undefined,
      });

      toast({
        title: 'Success',
        description: 'Verification completed successfully',
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error performing verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete verification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOverdue = equipment.daysUntilDue < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Perform Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <div>
            <p className="text-sm text-gray-600">Equipment</p>
            <p className="font-medium">{equipment.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vessel / Location</p>
            <p className="font-medium">
              {equipment.vessel.name} / {equipment.location?.name || 'No location'}
            </p>
          </div>
          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.abs(equipment.daysUntilDue)} days overdue
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Verification Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setVerificationType('SCHEDULED')}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  verificationType === 'SCHEDULED'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setVerificationType('MANUAL')}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  verificationType === 'MANUAL'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setVerificationType('CORRECTIVE')}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  verificationType === 'CORRECTIVE'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Corrective
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="qualityScore">New Quality Score</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="qualityScore"
                type="number"
                min="0"
                max="100"
                value={qualityScore}
                onChange={(e) => setQualityScore(Number(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Current:</span>
                <span className={`font-medium ${
                  equipment.degradedQualityScore < equipment.qualityScore
                    ? 'text-red-600'
                    : 'text-gray-700'
                }`}>
                  {equipment.degradedQualityScore}%
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    qualityScore >= 80 ? 'bg-green-500' :
                    qualityScore >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="findings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Findings
            </Label>
            <textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe any findings during verification..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {verificationType === 'CORRECTIVE' && (
            <div>
              <Label htmlFor="correctiveActions" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Corrective Actions <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="correctiveActions"
                value={correctiveActions}
                onChange={(e) => setCorrectiveActions(e.target.value)}
                placeholder="Describe corrective actions taken..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required={verificationType === 'CORRECTIVE'}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Completing...' : 'Complete Verification'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};