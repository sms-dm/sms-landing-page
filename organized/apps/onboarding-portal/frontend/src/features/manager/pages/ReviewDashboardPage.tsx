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
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sms-cyan"></div>
      </div>
    );
  }

  if (vesselsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">Failed to load vessels. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Manager Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage vessel assignments and track onboarding progress</p>
        </div>

      {/* Statistics */}
      {stats && <AssignmentStats stats={stats} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vessels Needing Onboarding - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Ship className="h-5 w-5 text-sms-cyan" />
                Vessels Needing Onboarding
              </h3>
              {unassignedVessels.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400">All vessels have been assigned!</p>
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
            </div>

            {/* Current Assignments */}
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-sms-cyan" />
                Current Assignments
              </h3>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active assignments yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.01] cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{assignment.vessel.name}</h4>
                          <p className="text-sm text-gray-400">
                            IMO: {assignment.vessel.imoNumber}
                          </p>
                          <p className="text-sm mt-1 text-gray-300">
                            Assigned to: <span className="font-medium text-sms-cyan">
                              {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full border ${
                            assignment.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                            assignment.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                            'bg-amber-900/30 text-amber-400 border-amber-500/30'
                          }`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    </div>
  );
}