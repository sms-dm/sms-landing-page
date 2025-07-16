import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingDown,
  Bell,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress-indicator';
import { verificationService, VerificationDashboardStats, EquipmentDue } from '@/services/verification';
import { useToast } from '@/utils/toast';
import { format } from 'date-fns';

interface VerificationDashboardProps {
  vesselId?: string;
  onVerifyEquipment?: (equipment: EquipmentDue) => void;
}

export const VerificationDashboard: React.FC<VerificationDashboardProps> = ({
  vesselId,
  onVerifyEquipment,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VerificationDashboardStats | null>(null);
  const [overdueEquipment, setOverdueEquipment] = useState<EquipmentDue[]>([]);
  const [dueSoonEquipment, setDueSoonEquipment] = useState<EquipmentDue[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [vesselId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const dashboardData = await verificationService.getDashboardStats(vesselId);
      setStats(dashboardData.statistics);

      // Load overdue equipment
      const overdueData = await verificationService.getEquipmentDue({
        vesselId,
        overdue: true,
      });
      setOverdueEquipment(overdueData.equipment);

      // Load due soon equipment (next 7 days)
      const dueSoonData = await verificationService.getEquipmentDue({
        vesselId,
        daysAhead: 7,
        overdue: false,
      });
      setDueSoonEquipment(dueSoonData.equipment.filter(eq => eq.daysUntilDue >= 0));
    } catch (error) {
      console.error('Error loading verification dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDaysUntilDueColor = (days: number) => {
    if (days < -30) return 'text-red-600 bg-red-50';
    if (days < 0) return 'text-orange-600 bg-orange-50';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getDaysUntilDueText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    return `Due in ${days} days`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Equipment</p>
              <p className="text-2xl font-bold">{stats.totalEquipment}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.dueSoonCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Verifications</p>
              <p className="text-2xl font-bold text-green-600">{stats.recentVerifications}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Average Quality Score */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Average Data Quality Score</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress value={stats.averageQualityScore} className="h-4" />
          </div>
          <span className={`text-2xl font-bold ${getQualityColor(stats.averageQualityScore)}`}>
            {stats.averageQualityScore}%
          </span>
        </div>
      </Card>

      {/* Overdue Equipment */}
      {overdueEquipment.length > 0 && (
        <Card className="p-6 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Overdue Verifications
            </h3>
            <span className="text-sm text-red-600 font-medium">
              {overdueEquipment.length} equipment
            </span>
          </div>
          <div className="space-y-3">
            {overdueEquipment.slice(0, showAll ? undefined : 5).map((equipment) => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{equipment.name}</p>
                  <p className="text-sm text-gray-600">
                    {equipment.vessel.name} • {equipment.location?.name || 'No location'}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-red-600 font-medium">
                      {Math.abs(equipment.daysUntilDue)} days overdue
                    </span>
                    <span className="text-sm text-gray-500">
                      Quality: {equipment.degradedQualityScore}% 
                      {equipment.degradedQualityScore < equipment.qualityScore && (
                        <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
                      )}
                    </span>
                  </div>
                </div>
                {onVerifyEquipment && (
                  <Button
                    size="sm"
                    onClick={() => onVerifyEquipment(equipment)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Verify Now
                  </Button>
                )}
              </div>
            ))}
            {overdueEquipment.length > 5 && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full"
              >
                Show All ({overdueEquipment.length})
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Due Soon Equipment */}
      {dueSoonEquipment.length > 0 && (
        <Card className="p-6 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Due Soon
            </h3>
            <span className="text-sm text-yellow-600 font-medium">
              Next 7 days
            </span>
          </div>
          <div className="space-y-3">
            {dueSoonEquipment.slice(0, 5).map((equipment) => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{equipment.name}</p>
                  <p className="text-sm text-gray-600">
                    {equipment.vessel.name} • {equipment.location?.name || 'No location'}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getDaysUntilDueColor(equipment.daysUntilDue)}`}>
                      {getDaysUntilDueText(equipment.daysUntilDue)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Due: {format(new Date(equipment.nextVerificationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                {onVerifyEquipment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVerifyEquipment(equipment)}
                  >
                    Schedule
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};