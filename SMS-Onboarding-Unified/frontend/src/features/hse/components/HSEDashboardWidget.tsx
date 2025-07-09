// HSE Dashboard Widget Component
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { hseService } from '../../../services/hse';
import { UserRole } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';

interface HSEDashboardWidgetProps {
  vesselId?: string;
  compact?: boolean;
}

export const HSEDashboardWidget: React.FC<HSEDashboardWidgetProps> = ({
  vesselId,
  compact = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Check if user has HSE access
  const hasHSEAccess = user && [
    UserRole.HSE_OFFICER,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ].includes(user.role);

  useEffect(() => {
    if (hasHSEAccess) {
      fetchDashboardData();
    }
  }, [hasHSEAccess]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await hseService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching HSE dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHSEAccess) {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const getUrgencyColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            HSE Status
          </h3>
          {vesselId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/hse/vessels/${vesselId}/onboarding`)}
            >
              View Details
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Expiring Certificates:</span>
            <span className={`ml-2 font-medium ${getUrgencyColor(dashboardData.certificatesExpiringSoon)}`}>
              {dashboardData.certificatesExpiringSoon}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Overdue Inspections:</span>
            <span className={`ml-2 font-medium ${getUrgencyColor(dashboardData.overdueInspections)}`}>
              {dashboardData.overdueInspections}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Upcoming Drills:</span>
            <span className="ml-2 font-medium">
              {dashboardData.upcomingDrills}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Open Issues:</span>
            <span className={`ml-2 font-medium ${getUrgencyColor(dashboardData.openNonConformities)}`}>
              {dashboardData.openNonConformities}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          Health, Safety & Environment
        </h2>
        {vesselId && (
          <Button
            onClick={() => navigate(`/hse/vessels/${vesselId}/onboarding`)}
          >
            Manage HSE
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className={`text-3xl font-bold ${getUrgencyColor(dashboardData.certificatesExpiringSoon)}`}>
            {dashboardData.certificatesExpiringSoon}
          </p>
          <p className="text-sm text-gray-600 mt-1">Certificates Expiring</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className={`text-3xl font-bold ${getUrgencyColor(dashboardData.overdueInspections)}`}>
            {dashboardData.overdueInspections}
          </p>
          <p className="text-sm text-gray-600 mt-1">Overdue Inspections</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData.upcomingDrills}
          </p>
          <p className="text-sm text-gray-600 mt-1">Upcoming Drills</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className={`text-3xl font-bold ${getUrgencyColor(dashboardData.openNonConformities)}`}>
            {dashboardData.openNonConformities}
          </p>
          <p className="text-sm text-gray-600 mt-1">Open Non-Conformities</p>
        </div>
      </div>

      {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Recent HSE Activity</h3>
          <div className="space-y-3">
            {dashboardData.recentActivity.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="text-2xl">
                  {activity.type === 'certificate_added' && '📋'}
                  {activity.type === 'drill_completed' && '✅'}
                  {activity.type === 'inspection_scheduled' && '🔍'}
                  {activity.type === 'issue_resolved' && '✓'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.vesselName} • {new Date(activity.timestamp).toLocaleDateString()} • {activity.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};