import { useState } from 'react';
import { X, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { 
  useGetVesselsNeedingOnboardingQuery, 
  useGetTeamMembersQuery, 
  useAssignVesselMutation 
} from '../services/managerApi';

interface AssignVesselDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vesselId: string | null;
  onComplete: () => void;
}

export function AssignVesselDialog({ isOpen, onClose, vesselId, onComplete }: AssignVesselDialogProps) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);

  const { data: vesselsData } = useGetVesselsNeedingOnboardingQuery();
  const { data: teamData } = useGetTeamMembersQuery();
  const [assignVessel, { isLoading }] = useAssignVesselMutation();

  const vessel = vesselsData?.data?.find(v => v.id === vesselId);
  const teamMembers = teamData?.data || [];

  if (!isOpen || !vessel) return null;

  const handleAssign = async () => {
    if (!selectedMember) {
      toast({
        title: 'Please select a team member',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assignVessel({
        vesselId: vessel.id,
        assignedToId: selectedMember,
        notes: notes.trim() || undefined,
      }).unwrap();

      if (sendReminder) {
        toast({
          title: 'Assignment successful',
          description: 'A login reminder has been sent to the assigned team member.',
        });
      }

      onComplete();
      handleClose();
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setSelectedMember('');
    setNotes('');
    setSendReminder(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Assign Vessel</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Vessel Info */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold">{vessel.name}</h3>
            <p className="text-sm text-muted-foreground">IMO: {vessel.imoNumber}</p>
            <div className="flex gap-3 mt-2 text-sm">
              <span>Type: {vessel.vesselType}</span>
              <span>Flag: {vessel.flag}</span>
            </div>
          </div>

          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="team-member">Assign to</Label>
            <select
              id="team-member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a team member...</option>
              <optgroup label="Technicians">
                {teamMembers
                  .filter(m => m.role === 'technician' && m.isActive)
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="HSE Officers">
                {teamMembers
                  .filter(m => m.role === 'hse_officer' && m.isActive)
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
            />
          </div>

          {/* Send Reminder */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="send-reminder"
              checked={sendReminder}
              onChange={(e) => setSendReminder(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="send-reminder" className="text-sm font-normal cursor-pointer">
              Send login reminder to assigned team member
            </Label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assigning...
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                Assign Vessel
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}