// Safety Status Section Component
import React from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { CurrentSafetyStatus } from '../../../types';

interface SafetyStatusSectionProps {
  status: CurrentSafetyStatus;
  onUpdate: (status: CurrentSafetyStatus) => void;
  canEdit: boolean;
}

export const SafetyStatusSection: React.FC<SafetyStatusSectionProps> = ({
  status,
  onUpdate,
  canEdit
}) => {
  const updateField = (field: keyof CurrentSafetyStatus, value: any) => {
    if (!canEdit) return;
    onUpdate({
      ...status,
      [field]: value
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDaysUntil = (date?: Date) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDateStatus = (days: number | null) => {
    if (days === null) return '';
    if (days < 0) return 'text-red-600 font-medium';
    if (days <= 7) return 'text-yellow-600 font-medium';
    if (days <= 30) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Current Safety Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drills Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <span className="text-xl">🚨</span>
            Safety Drills
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="lastDrillDate">Last Drill Date</Label>
              <Input
                id="lastDrillDate"
                type="date"
                value={status.lastDrillDate 
                  ? new Date(status.lastDrillDate).toISOString().split('T')[0]
                  : ''
                }
                onChange={(e) => updateField(
                  'lastDrillDate',
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                disabled={!canEdit}
                className="mt-1"
              />
              {status.lastDrillDate && (
                <p className="mt-1 text-sm text-gray-500">
                  {Math.abs(getDaysUntil(status.lastDrillDate) || 0)} days ago
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="nextDrillDate">Next Drill Date</Label>
              <Input
                id="nextDrillDate"
                type="date"
                value={status.nextDrillDate 
                  ? new Date(status.nextDrillDate).toISOString().split('T')[0]
                  : ''
                }
                onChange={(e) => updateField(
                  'nextDrillDate',
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                disabled={!canEdit}
                className="mt-1"
              />
              {status.nextDrillDate && (
                <p className={`mt-1 text-sm ${getDateStatus(getDaysUntil(status.nextDrillDate))}`}>
                  {(() => {
                    const days = getDaysUntil(status.nextDrillDate);
                    if (days === null) return '';
                    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
                    if (days === 0) return 'Due today';
                    if (days === 1) return 'Due tomorrow';
                    return `Due in ${days} days`;
                  })()}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Inspections Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <span className="text-xl">🔍</span>
            Safety Inspections
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="lastInspectionDate">Last Inspection Date</Label>
              <Input
                id="lastInspectionDate"
                type="date"
                value={status.lastInspectionDate 
                  ? new Date(status.lastInspectionDate).toISOString().split('T')[0]
                  : ''
                }
                onChange={(e) => updateField(
                  'lastInspectionDate',
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                disabled={!canEdit}
                className="mt-1"
              />
              {status.lastInspectionDate && (
                <p className="mt-1 text-sm text-gray-500">
                  {Math.abs(getDaysUntil(status.lastInspectionDate) || 0)} days ago
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="nextInspectionDate">Next Inspection Date</Label>
              <Input
                id="nextInspectionDate"
                type="date"
                value={status.nextInspectionDate 
                  ? new Date(status.nextInspectionDate).toISOString().split('T')[0]
                  : ''
                }
                onChange={(e) => updateField(
                  'nextInspectionDate',
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                disabled={!canEdit}
                className="mt-1"
              />
              {status.nextInspectionDate && (
                <p className={`mt-1 text-sm ${getDateStatus(getDaysUntil(status.nextInspectionDate))}`}>
                  {(() => {
                    const days = getDaysUntil(status.nextInspectionDate);
                    if (days === null) return '';
                    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
                    if (days === 0) return 'Due today';
                    if (days === 1) return 'Due tomorrow';
                    return `Due in ${days} days`;
                  })()}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Non-Conformities Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Non-Conformities
          </h3>
          
          <div>
            <Label htmlFor="openNonConformities">Open Non-Conformities</Label>
            <Input
              id="openNonConformities"
              type="number"
              min="0"
              value={status.openNonConformities || 0}
              onChange={(e) => updateField(
                'openNonConformities',
                parseInt(e.target.value) || 0
              )}
              disabled={!canEdit}
              className="mt-1"
            />
            {status.openNonConformities > 0 && (
              <p className={`mt-1 text-sm ${
                status.openNonConformities > 5 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {status.openNonConformities > 5 
                  ? 'High number of open issues' 
                  : 'Some issues require attention'
                }
              </p>
            )}
          </div>
        </Card>

        {/* Risk Assessment Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Risk Assessment
          </h3>
          
          <div>
            <Label htmlFor="overallRiskLevel">Overall Risk Level</Label>
            <select
              id="overallRiskLevel"
              value={status.overallRiskLevel}
              onChange={(e) => updateField(
                'overallRiskLevel',
                e.target.value as 'low' | 'medium' | 'high'
              )}
              disabled={!canEdit}
              className={`mt-1 w-full px-3 py-2 border rounded-md ${
                canEdit ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            
            <div className={`mt-3 p-3 rounded-md border ${getRiskLevelColor(status.overallRiskLevel)}`}>
              <p className="text-sm font-medium">
                {status.overallRiskLevel === 'low' && '✓ Vessel operating within acceptable safety parameters'}
                {status.overallRiskLevel === 'medium' && '! Moderate safety concerns require attention'}
                {status.overallRiskLevel === 'high' && '⚠ Immediate safety actions required'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Remarks Section */}
      <Card className="p-4 mt-6">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <span className="text-xl">📝</span>
          Safety Remarks
        </h3>
        
        <textarea
          id="remarks"
          value={status.remarks || ''}
          onChange={(e) => updateField('remarks', e.target.value)}
          disabled={!canEdit}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md resize-none ${
            canEdit ? 'bg-white' : 'bg-gray-50'
          }`}
          placeholder="Add any safety-related remarks, observations, or recommendations..."
        />
      </Card>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {status.openNonConformities || 0}
          </p>
          <p className="text-sm text-gray-600">Open Issues</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {status.nextDrillDate 
              ? Math.max(0, getDaysUntil(status.nextDrillDate) || 0)
              : '—'
            }
          </p>
          <p className="text-sm text-gray-600">Days to Next Drill</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {status.nextInspectionDate 
              ? Math.max(0, getDaysUntil(status.nextInspectionDate) || 0)
              : '—'
            }
          </p>
          <p className="text-sm text-gray-600">Days to Next Inspection</p>
        </div>
        
        <div className={`text-center p-4 rounded-lg ${
          getRiskLevelColor(status.overallRiskLevel).replace('border-', 'bg-').replace('-300', '-50')
        }`}>
          <p className="text-2xl font-bold capitalize">
            {status.overallRiskLevel}
          </p>
          <p className="text-sm">Risk Level</p>
        </div>
      </div>
    </div>
  );
};