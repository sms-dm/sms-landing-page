import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TechnicianAssignment, OnboardingFlowState, QualityScoreBreakdown } from '../types';
import { technicianApi } from '../services/technicianApi';
import { offlineService } from '../services/offlineService';
import { CheckCircle, AlertCircle, Upload, Camera, FileText, Package } from 'lucide-react';

interface ReviewSubmitProps {
  assignment: TechnicianAssignment;
  flowState: OnboardingFlowState;
  onSubmit: () => void;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({
  assignment,
  flowState,
  onSubmit,
}) => {
  const [qualityScore, setQualityScore] = useState<QualityScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    loadQualityScore();
  }, []);

  const loadQualityScore = async () => {
    try {
      const score = await technicianApi.getQualityScore(assignment.vesselId);
      setQualityScore(score);
    } catch (err) {
      console.error('Failed to load quality score:', err);
      // Create a mock score for offline mode
      setQualityScore({
        overall: calculateOfflineScore(),
        dataCompleteness: 85,
        photoQuality: 90,
        criticalPartsIdentified: 75,
        documentationUploaded: 60,
        details: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOfflineScore = () => {
    const pendingUploads = flowState.pendingUploads.length;
    const offlineData = flowState.offlineData.length;
    const baseScore = 70;
    const uploadBonus = Math.min(pendingUploads * 2, 20);
    const dataBonus = Math.min(offlineData * 1, 10);
    return Math.min(baseScore + uploadBonus + dataBonus, 100);
  };

  const syncOfflineData = async () => {
    const unsyncedData = await offlineService.getUnsyncedData();
    const pendingUploads = await offlineService.getPendingUploads();
    
    const totalItems = unsyncedData.length + pendingUploads.length;
    let completed = 0;

    // Sync data
    for (const data of unsyncedData) {
      try {
        // TODO: Implement actual sync logic based on data type
        await offlineService.markDataAsSynced(data.id);
        completed++;
        setSyncProgress(Math.round((completed / totalItems) * 100));
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    }

    // Upload pending photos
    for (const upload of pendingUploads) {
      try {
        if (upload.compressedFile) {
          await technicianApi.uploadPhoto(
            upload.entityType,
            upload.entityId,
            upload.compressedFile
          );
          await offlineService.updateUploadStatus(upload.id, 'completed');
        }
        completed++;
        setSyncProgress(Math.round((completed / totalItems) * 100));
      } catch (err) {
        console.error('Failed to upload photo:', err);
        await offlineService.updateUploadStatus(upload.id, 'failed', err.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Sync offline data if online
      if (navigator.onLine) {
        await syncOfflineData();
      }

      onSubmit();
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent data quality!';
    if (score >= 60) return 'Good progress, consider adding more details';
    return 'Additional information needed for complete onboarding';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review & Submit</h2>
        <p className="text-gray-600">
          Review your onboarding progress and submit when ready
        </p>
      </div>

      {/* Quality Score Card */}
      {qualityScore && (
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(qualityScore.overall)}`}>
              {qualityScore.overall}%
            </div>
            <p className="text-lg font-medium">Quality Score</p>
            <p className={`text-sm mt-1 ${getScoreColor(qualityScore.overall)}`}>
              {getScoreMessage(qualityScore.overall)}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-semibold">{qualityScore.dataCompleteness}%</p>
              <p className="text-sm text-gray-600">Data Complete</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Camera className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-semibold">{qualityScore.photoQuality}%</p>
              <p className="text-sm text-gray-600">Photo Quality</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-2xl font-semibold">{qualityScore.criticalPartsIdentified}%</p>
              <p className="text-sm text-gray-600">Critical Parts</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-semibold">{qualityScore.documentationUploaded}%</p>
              <p className="text-sm text-gray-600">Documentation</p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">Onboarding Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Locations Added</span>
            <span className="font-medium">{assignment.progress.locationsCompleted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Equipment Documented</span>
            <span className="font-medium">{assignment.progress.equipmentCompleted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Spare Parts Cataloged</span>
            <span className="font-medium">{assignment.progress.partsCompleted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Photos Captured</span>
            <span className="font-medium">{assignment.progress.photosUploaded}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Critical Parts Identified</span>
            <span className="font-medium text-orange-600">
              {assignment.progress.criticalPartsIdentified}
            </span>
          </div>
        </div>
      </Card>

      {/* Offline Data Status */}
      {(flowState.offlineData.length > 0 || flowState.pendingUploads.length > 0) && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900">Pending Sync</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {flowState.offlineData.length} data entries and {flowState.pendingUploads.length} photos 
                will be synced when online
              </p>
              {syncProgress > 0 && syncProgress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Syncing...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Quality Issues */}
      {qualityScore && qualityScore.details.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">Quality Recommendations</h3>
          <div className="space-y-3">
            {qualityScore.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium">{detail.category}</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {detail.suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Submit Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={submitting}
          className="flex-1"
        >
          Back to Edit
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Complete Onboarding
            </>
          )}
        </Button>
      </div>
    </div>
  );
};