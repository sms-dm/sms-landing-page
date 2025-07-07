import React from 'react';
import { Card } from '@/components/ui/card';
import { EquipmentStats as EquipmentStatsType } from '../services/equipmentApi';
import { EquipmentStatus, CriticalLevel } from '@/types';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Activity
} from 'lucide-react';

interface Props {
  stats: EquipmentStatsType;
}

const statusIcons = {
  [EquipmentStatus.PLANNED]: Clock,
  [EquipmentStatus.ARRIVING]: Package,
  [EquipmentStatus.ACTIVE]: Activity,
  [EquipmentStatus.APPROVED]: CheckCircle,
  [EquipmentStatus.PENDING_REVIEW]: Clock,
};

const criticalityColors = {
  [CriticalLevel.CRITICAL]: 'text-red-600 bg-red-50',
  [CriticalLevel.HIGH]: 'text-orange-600 bg-orange-50',
  [CriticalLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
  [CriticalLevel.LOW]: 'text-green-600 bg-green-50',
};

export default function EquipmentStats({ stats }: Props) {
  const getStatusCount = (status: EquipmentStatus) => stats.byStatus[status] || 0;
  const getCriticalityCount = (level: CriticalLevel) => stats.byCriticality[level] || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Equipment */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Equipment</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      {/* Status Distribution */}
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Status Distribution</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active</span>
              <span className="font-medium">{getStatusCount(EquipmentStatus.ACTIVE)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending Review</span>
              <span className="font-medium">{getStatusCount(EquipmentStatus.PENDING_REVIEW)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Planned</span>
              <span className="font-medium">{getStatusCount(EquipmentStatus.PLANNED)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Criticality Breakdown */}
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Criticality Levels</p>
          <div className="space-y-1">
            {Object.values(CriticalLevel).map(level => (
              <div key={level} className="flex justify-between items-center">
                <span className={`text-sm px-2 py-0.5 rounded ${criticalityColors[level]}`}>
                  {level}
                </span>
                <span className="font-medium">{getCriticalityCount(level)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Assignments */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Assigned Equipment</p>
            <p className="text-2xl font-bold">{stats.byAssignee.reduce((acc, a) => acc + a.count, 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.byAssignee.length} technicians
            </p>
          </div>
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <Card className="p-6 col-span-full">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map(equipment => (
              <div key={equipment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${criticalityColors[equipment.criticality]}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{equipment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {equipment.vessel?.name} - {equipment.manufacturer} {equipment.model}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    equipment.status === EquipmentStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                    equipment.status === EquipmentStatus.PENDING_REVIEW ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {equipment.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {equipment.documentedByUser ? 
                      `${equipment.documentedByUser.firstName} ${equipment.documentedByUser.lastName}` : 
                      'Unassigned'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}