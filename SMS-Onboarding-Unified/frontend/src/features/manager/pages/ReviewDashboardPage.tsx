import { useState } from 'react';
import { Plus, Ship, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VesselAssignmentCard } from '../components/VesselAssignmentCard';
import { TeamMembersList } from '../components/TeamMembersList';
import { AssignmentStats } from '../components/AssignmentStats';
import { AssignVesselDialog } from '../components/AssignVesselDialog';
import { useGetVesselsNeedingOnboardingQuery, useGetVesselAssignmentsQuery, useGetAssignmentStatsQuery } from '../services/managerApi';
import { toast } from '@/utils/toast';

export default function ReviewDashboardPage() {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  const { data: vesselsData, isLoading: vesselsLoading, error: vesselsError } = useGetVesselsNeedingOnboardingQuery();
  const { data: assignmentsData, isLoading: assignmentsLoading } = useGetVesselAssignmentsQuery();
  const { data: statsData, isLoading: statsLoading } = useGetAssignmentStatsQuery();

  const vessels = vesselsData?.data || [];
  const assignments = assignmentsData?.data || [];
  const stats = statsData?.data;

  const unassignedVessels = vessels.filter(
    vessel => !assignments.some(assignment => assignment.vesselId === vessel.id)
  );

  const handleAssignVessel = (vesselId: string) => {
    setSelectedVessel(vesselId);
    setIsAssignDialogOpen(true);
  };

  const handleAssignmentComplete = () => {
    setIsAssignDialogOpen(false);
    setSelectedVessel(null);
    toast({
      title: 'Vessel assigned successfully',
      description: 'The team member will be notified of their new assignment.',
      variant: 'success',
    });
  };

  if (vesselsLoading || assignmentsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (vesselsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load vessels. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Manage vessel assignments and track onboarding progress</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && <AssignmentStats stats={stats} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessels Needing Onboarding - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Vessels Needing Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedVessels.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">All vessels have been assigned!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedVessels.map((vessel) => (
                    <VesselAssignmentCard
                      key={vessel.id}
                      vessel={vessel}
                      onAssign={() => handleAssignVessel(vessel.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active assignments yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{assignment.vessel.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            IMO: {assignment.vessel.imoNumber}
                          </p>
                          <p className="text-sm mt-1">
                            Assigned to: <span className="font-medium">
                              {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            assignment.status === 'completed' ? 'bg-success/10 text-success' :
                            assignment.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members - 1 column */}
        <div>
          <TeamMembersList />
        </div>
      </div>

      {/* Assign Vessel Dialog */}
      <AssignVesselDialog
        isOpen={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setSelectedVessel(null);
        }}
        vesselId={selectedVessel}
        onComplete={handleAssignmentComplete}
      />
    </div>
  );
}