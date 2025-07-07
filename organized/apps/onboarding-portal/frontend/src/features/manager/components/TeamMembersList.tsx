import { Users, User, HardHat, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useGetTeamMembersQuery } from '../services/managerApi';

export function TeamMembersList() {
  const { data, isLoading, error } = useGetTeamMembersQuery();
  const teamMembers = data?.data || [];

  const technicians = teamMembers.filter(member => member.role === 'technician');
  const hseOfficers = teamMembers.filter(member => member.role === 'hse_officer');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">Failed to load team members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Technicians Section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <HardHat className="h-4 w-4" />
            Technicians ({technicians.length})
          </h4>
          <div className="space-y-2">
            {technicians.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No technicians available</p>
            ) : (
              technicians.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {member.isActive && (
                    <div className="h-2 w-2 rounded-full bg-success" title="Active" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* HSE Officers Section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            HSE Officers ({hseOfficers.length})
          </h4>
          <div className="space-y-2">
            {hseOfficers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No HSE officers available</p>
            ) : (
              hseOfficers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {member.isActive && (
                    <div className="h-2 w-2 rounded-full bg-success" title="Active" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Count */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Total team members: {teamMembers.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}