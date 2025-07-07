import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingStep, OnboardingFlowState, TechnicianAssignment } from '../types';
import { technicianApi } from '../services/technicianApi';
import { LocationSelector } from './LocationSelector';
import { EquipmentForm } from './EquipmentForm';
import { PartsManager } from './PartsManager';
import { ReviewSubmit } from './ReviewSubmit';
import { Button } from '@/components/ui/button';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { offlineService } from '../services/offlineService';
import { syncService } from '../services/syncService';

export const OnboardingFlow: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const isOffline = useOfflineStatus();
  
  const [assignment, setAssignment] = useState<TechnicianAssignment | null>(null);
  const [flowState, setFlowState] = useState<OnboardingFlowState>({
    currentStep: OnboardingStep.SELECT_LOCATION,
    vesselId: '',
    pendingUploads: [],
    offlineData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  useEffect(() => {
    // Initialize offline service
    offlineService.init();
    
    // Start auto-sync when online
    syncService.startAutoSync(30000); // Sync every 30 seconds
    
    // Cleanup on unmount
    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const data = await technicianApi.getAssignmentDetails(assignmentId!);
      setAssignment(data);
      setFlowState(prev => ({ ...prev, vesselId: data.vesselId }));
    } catch (err) {
      console.error('Failed to load assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (data: any) => {
    switch (flowState.currentStep) {
      case OnboardingStep.SELECT_LOCATION:
        setFlowState(prev => ({
          ...prev,
          selectedLocation: data,
          currentStep: OnboardingStep.ADD_EQUIPMENT,
        }));
        break;
      case OnboardingStep.ADD_EQUIPMENT:
        setFlowState(prev => ({
          ...prev,
          selectedEquipment: data.id,
          currentStep: OnboardingStep.ADD_PARTS,
        }));
        break;
      case OnboardingStep.ADD_PARTS:
        setFlowState(prev => ({
          ...prev,
          currentStep: OnboardingStep.REVIEW,
        }));
        break;
      case OnboardingStep.REVIEW:
        handleSubmit();
        break;
    }
  };

  const handleStepBack = () => {
    switch (flowState.currentStep) {
      case OnboardingStep.ADD_EQUIPMENT:
        setFlowState(prev => ({
          ...prev,
          currentStep: OnboardingStep.SELECT_LOCATION,
          selectedEquipment: undefined,
        }));
        break;
      case OnboardingStep.ADD_PARTS:
        setFlowState(prev => ({
          ...prev,
          currentStep: OnboardingStep.ADD_EQUIPMENT,
        }));
        break;
      case OnboardingStep.REVIEW:
        setFlowState(prev => ({
          ...prev,
          currentStep: OnboardingStep.ADD_PARTS,
        }));
        break;
    }
  };

  const handleSubmit = async () => {
    try {
      // Submit or queue for sync
      if (!isOffline) {
        await technicianApi.completeAssignment(assignmentId!);
      } else {
        // Queue for later sync
        await offlineService.saveOfflineData({
          id: `complete-${assignmentId}`,
          type: 'assignment',
          action: 'update',
          data: { status: 'completed' },
          timestamp: new Date(),
          synced: false,
        });
      }
      navigate('/tech/assignments');
    } catch (err) {
      console.error('Failed to complete assignment:', err);
    }
  };

  const getStepComponent = () => {
    switch (flowState.currentStep) {
      case OnboardingStep.SELECT_LOCATION:
        return (
          <LocationSelector
            vesselId={flowState.vesselId}
            onSelect={handleStepComplete}
            flowState={flowState}
            setFlowState={setFlowState}
          />
        );
      case OnboardingStep.ADD_EQUIPMENT:
        return (
          <EquipmentForm
            locationId={flowState.selectedLocation?.id || ''}
            onComplete={handleStepComplete}
            flowState={flowState}
            setFlowState={setFlowState}
          />
        );
      case OnboardingStep.ADD_PARTS:
        return (
          <PartsManager
            equipmentId={flowState.selectedEquipment || ''}
            onComplete={handleStepComplete}
            flowState={flowState}
            setFlowState={setFlowState}
          />
        );
      case OnboardingStep.REVIEW:
        return (
          <ReviewSubmit
            assignment={assignment!}
            flowState={flowState}
            onSubmit={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  const getProgressSteps = () => [
    { key: OnboardingStep.SELECT_LOCATION, label: 'Location' },
    { key: OnboardingStep.ADD_EQUIPMENT, label: 'Equipment' },
    { key: OnboardingStep.ADD_PARTS, label: 'Parts' },
    { key: OnboardingStep.REVIEW, label: 'Review' },
  ];

  const getCurrentStepIndex = () => {
    return getProgressSteps().findIndex(step => step.key === flowState.currentStep);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Assignment not found</p>
        <Button onClick={() => navigate('/tech/assignments')}>Back to Assignments</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{assignment.vessel.name}</h1>
              <p className="text-sm text-gray-600">IMO: {assignment.vessel.imoNumber}</p>
            </div>
            {isOffline && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                Offline Mode
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {getProgressSteps().map((step, index) => (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= getCurrentStepIndex()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-2 text-sm font-medium">
                    {step.label}
                  </div>
                </div>
                {index < getProgressSteps().length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      index < getCurrentStepIndex()
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {getStepComponent()}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleStepBack}
            disabled={flowState.currentStep === OnboardingStep.SELECT_LOCATION}
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/tech/assignments')}
          >
            Save & Exit
          </Button>
        </div>
      </div>
    </div>
  );
};