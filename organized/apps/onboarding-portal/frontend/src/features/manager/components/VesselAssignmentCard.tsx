import { Ship, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vessel } from '@/types';
import { useState } from 'react';

interface VesselAssignmentCardProps {
  vessel: Vessel;
  onAssign: () => void;
}

export function VesselAssignmentCard({ vessel, onAssign }: VesselAssignmentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onAssign();
    } catch (err: any) {
      setError(err.message || 'Failed to assign vessel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.01] cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="p-2 bg-sms-cyan/10 rounded-lg">
            <Ship className="h-5 w-5 text-sms-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{vessel.name}</h3>
            <p className="text-sm text-gray-400">IMO: {vessel.imoNumber}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-300">
              <span>Type: {vessel.vesselType || vessel.type}</span>
              <span>Flag: {vessel.flag}</span>
              <span>Year: {vessel.yearBuilt}</span>
            </div>
            <div className="mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-500/30">
                Awaiting Assignment
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAssign}
          size="sm"
          className="gap-2 bg-gray-700 hover:bg-sms-cyan/20 border border-gray-600 hover:border-sms-cyan/30 text-white transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <User className="h-4 w-4" />
          )}
          Assign
        </Button>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}