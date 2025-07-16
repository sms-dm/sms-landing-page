import React, { useState } from 'react';
import { X, Calendar, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verificationService } from '@/services/verification';
import { useToast } from '@/utils/toast';

interface VerificationScheduleDialogProps {
  equipment: {
    id: string;
    name: string;
    verificationIntervalDays?: number;
    dataQualityDegradationRate?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationScheduleDialog: React.FC<VerificationScheduleDialogProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [intervalDays, setIntervalDays] = useState(
    equipment.verificationIntervalDays || 90
  );
  const [degradationRate, setDegradationRate] = useState(
    equipment.dataQualityDegradationRate || 5
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (intervalDays < 1) {
      toast({
        title: 'Invalid interval',
        description: 'Verification interval must be at least 1 day',
        variant: 'destructive',
      });
      return;
    }

    if (degradationRate < 0 || degradationRate > 100) {
      toast({
        title: 'Invalid degradation rate',
        description: 'Degradation rate must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await verificationService.setVerificationSchedule({
        equipmentId: equipment.id,
        verificationIntervalDays: intervalDays,
        dataQualityDegradationRate: degradationRate,
      });

      toast({
        title: 'Success',
        description: 'Verification schedule updated successfully',
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error setting verification schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Set Verification Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Equipment</p>
          <p className="font-medium">{equipment.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="intervalDays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Verification Interval (days)
            </Label>
            <Input
              id="intervalDays"
              type="number"
              min="1"
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              placeholder="e.g., 90"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              How often should this equipment be verified?
            </p>
          </div>

          <div>
            <Label htmlFor="degradationRate" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Quality Degradation Rate (% per month)
            </Label>
            <Input
              id="degradationRate"
              type="number"
              min="0"
              max="100"
              value={degradationRate}
              onChange={(e) => setDegradationRate(Number(e.target.value))}
              placeholder="e.g., 5"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              How much should the quality score degrade per month when overdue?
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Example:</strong> With a {intervalDays}-day interval and {degradationRate}% monthly degradation:
            </p>
            <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
              <li>Next verification will be due in {intervalDays} days</li>
              <li>If overdue by 30 days, quality score will drop by {degradationRate}%</li>
              <li>If overdue by 60 days, quality score will drop by {degradationRate * 2}%</li>
            </ul>
          </div>

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
              {loading ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};