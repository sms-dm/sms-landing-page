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
        return 'text-green-400';
      case AssignmentStatus.IN_PROGRESS:
        return 'text-blue-400';
      case AssignmentStatus.OVERDUE:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getProgressPercentage = (progress: TechnicianAssignment['progress']) => {
    const total = progress.locationsTotal + progress.equipmentTotal + progress.partsTotal;
    const completed = progress.locationsCompleted + progress.equipmentCompleted + progress.partsCompleted;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sms-cyan"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadAssignments} className="bg-sms-blue text-white hover:bg-sms-cyan transition-colors">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">My Assignments</h1>
          {isOffline && (
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 text-sm">
              <span className="text-amber-400">Working offline - Changes will sync when connected</span>
            </div>
          )}
        </div>

        {/* Assignment Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => startAssignment(assignment)}
              className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02] text-left group w-full cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-white group-hover:text-sms-cyan transition-colors">{assignment.vessel.name}</h3>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full border ${
                    assignment.priority === 'high'
                      ? 'bg-red-900/30 text-red-400 border-red-500/30'
                      : assignment.priority === 'medium'
                      ? 'bg-amber-900/30 text-amber-400 border-amber-500/30'
                      : 'bg-gray-800 text-gray-400 border-gray-600'
                  }`}
                >
                  {assignment.priority}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
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
                  <span className="text-gray-500">Progress</span>
                  <span className="text-sms-cyan">{getProgressPercentage(assignment.progress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-sms-cyan to-sms-blue h-2 rounded-full transition-all"
                    style={{ width: `${getProgressPercentage(assignment.progress)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-semibold text-white">{assignment.progress.locationsCompleted}/{assignment.progress.locationsTotal}</p>
                  <p className="text-gray-500">Locations</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white">{assignment.progress.equipmentCompleted}/{assignment.progress.equipmentTotal}</p>
                  <p className="text-gray-500">Equipment</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white">{assignment.progress.partsCompleted}/{assignment.progress.partsTotal}</p>
                  <p className="text-gray-500">Parts</p>
                </div>
              </div>

              {assignment.qualityScore !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Quality Score</span>
                    <span className={`font-semibold ${
                      assignment.qualityScore >= 80 ? 'text-green-400' : 
                      assignment.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {assignment.qualityScore}%
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-sms-cyan/20 border border-gray-600 hover:border-sms-cyan/30 text-white rounded-lg text-center font-medium transition-all">
                {assignment.status === AssignmentStatus.ASSIGNED ? 'Start' : 'Continue'}
              </div>
            </button>
          ))}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No assignments found</p>
            <Button 
              onClick={loadAssignments}
              className="bg-sms-blue text-white hover:bg-sms-cyan transition-colors"
            >
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};