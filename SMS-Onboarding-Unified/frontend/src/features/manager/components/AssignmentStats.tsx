import { Ship, Users, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AssignmentStats as Stats } from '../services/managerApi';

interface AssignmentStatsProps {
  stats: Stats;
}

export function AssignmentStats({ stats }: AssignmentStatsProps) {
  const progressPercentage = stats.totalVessels > 0 
    ? Math.round((stats.assignedVessels / stats.totalVessels) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
              <p className="text-2xl font-bold">{stats.totalVessels}</p>
            </div>
            <Ship className="h-8 w-8 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold text-primary">{stats.assignedVessels}</p>
            </div>
            <Users className="h-8 w-8 text-primary/20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{stats.pendingVessels}</p>
            </div>
            <Clock className="h-8 w-8 text-warning/20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{stats.completedVessels}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success/20" />
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card className="md:col-span-4">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Assignment Progress</p>
              <p className="text-sm text-muted-foreground">
                {stats.assignedVessels} of {stats.totalVessels} vessels assigned ({progressPercentage}%)
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}