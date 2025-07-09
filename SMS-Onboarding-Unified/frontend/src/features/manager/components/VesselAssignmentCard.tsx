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
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ship className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{vessel.name}</h3>
            <p className="text-sm text-muted-foreground">IMO: {vessel.imoNumber}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Type: {vessel.vesselType || vessel.type}</span>
              <span>Flag: {vessel.flag}</span>
              <span>Year: {vessel.yearBuilt}</span>
            </div>
            <div className="mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                Awaiting Assignment
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleAssign}
          size="sm"
          variant="outline"
          className="gap-2"
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