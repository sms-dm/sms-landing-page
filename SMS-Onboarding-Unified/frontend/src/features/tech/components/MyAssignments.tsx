import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TechnicianAssignment, AssignmentStatus } from '../types';
import { technicianApi } from '../services/technicianApi';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { format } from 'date-fns';

export const MyAssignments: React.FC = () => {
  const navigate = useNavigate();
  const isOffline = useOfflineStatus();
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await technicianApi.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      setError('Failed to load assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startAssignment = async (assignment: TechnicianAssignment) => {
    try {
      if (assignment.status === AssignmentStatus.ASSIGNED) {
        await technicianApi.startAssignment(assignment.id);
      }
      navigate(`/tech/assignment/${assignment.id}`);
    } catch (err) {
      console.error('Failed to start assignment:', err);
    }
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.COMPLETED:
        return 'text-green-600';
      case AssignmentStatus.IN_PROGRESS:
        return 'text-blue-600';
      case AssignmentStatus.OVERDUE:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressPercentage = (progress: TechnicianAssignment['progress']) => {
    const total = progress.locationsTotal + progress.equipmentTotal + progress.partsTotal;
    const completed = progress.locationsCompleted + progress.equipmentCompleted + progress.partsCompleted;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadAssignments}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Assignments</h1>
        {isOffline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
            <span className="text-yellow-800">Working offline - Changes will sync when connected</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card
            key={assignment.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => startAssignment(assignment)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{assignment.vessel.name}</h3>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  assignment.priority === 'high'
                    ? 'bg-red-100 text-red-700'
                    : assignment.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {assignment.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>IMO: {assignment.vessel.imoNumber}</p>
              <p>Type: {assignment.vessel.vesselType}</p>
              <p>Company: {assignment.vessel.companyName}</p>
              <p className={getStatusColor(assignment.status)}>
                Status: {assignment.status.replace('_', ' ')}
              </p>
              {assignment.dueDate && (
                <p>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</p>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{getProgressPercentage(assignment.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${getProgressPercentage(assignment.progress)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-semibold">{assignment.progress.locationsCompleted}/{assignment.progress.locationsTotal}</p>
                <p className="text-gray-500">Locations</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{assignment.progress.equipmentCompleted}/{assignment.progress.equipmentTotal}</p>
                <p className="text-gray-500">Equipment</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{assignment.progress.partsCompleted}/{assignment.progress.partsTotal}</p>
                <p className="text-gray-500">Parts</p>
              </div>
            </div>

            {assignment.qualityScore !== undefined && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className={`font-semibold ${
                    assignment.qualityScore >= 80 ? 'text-green-600' : 
                    assignment.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {assignment.qualityScore}%
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              variant={assignment.status === AssignmentStatus.ASSIGNED ? 'default' : 'outline'}
            >
              {assignment.status === AssignmentStatus.ASSIGNED ? 'Start' : 'Continue'}
            </Button>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No assignments found</p>
          <Button variant="outline" onClick={loadAssignments}>
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
};