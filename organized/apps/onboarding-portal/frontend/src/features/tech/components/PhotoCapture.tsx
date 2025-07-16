import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { photoService } from '../services/photoService';
import { technicianApi } from '../services/technicianApi';
import { offlineService } from '../services/offlineService';
import { OnboardingFlowState } from '../types';

interface PhotoCaptureProps {
  entityType: 'location' | 'equipment' | 'part';
  entityId: string;
  onPhotoAdded: (url: string) => void;
  flowState: OnboardingFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<OnboardingFlowState>>;
  className?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  entityType,
  entityId,
  onPhotoAdded,
  flowState,
  setFlowState,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!photoService.isValidImage(file)) {
      setError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    // Check file size (max 10MB before compression)
    if (photoService.getFileSizeMB(file) > 10) {
      setError('Image file size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress image
      const compressedBlob = await photoService.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
      });

      console.log(
        `Compressed image from ${photoService.getFileSizeMB(file)}MB to ${photoService.getFileSizeMB(
          compressedBlob
        )}MB`
      );

      // Try to upload immediately if online
      if (navigator.onLine) {
        try {
          const url = await technicianApi.uploadPhoto(
            entityType,
            entityId,
            compressedBlob,
            {
              originalName: file.name,
              originalSize: file.size,
              compressedSize: compressedBlob.size,
            }
          );
          onPhotoAdded(url);
          setPreview(null);
        } catch (uploadError) {
          // If upload fails, queue for later
          await queuePhotoUpload(file, compressedBlob);
        }
      } else {
        // Queue for offline upload
        await queuePhotoUpload(file, compressedBlob);
      }
    } catch (err) {
      console.error('Failed to process photo:', err);
      setError('Failed to process photo. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const queuePhotoUpload = async (originalFile: File, compressedBlob: Blob) => {
    const pendingUpload = photoService.createPendingUpload(
      originalFile,
      compressedBlob,
      entityType,
      entityId
    );

    // Save to offline storage
    await offlineService.savePendingUpload(pendingUpload);

    // Update flow state
    setFlowState((prev) => ({
      ...prev,
      pendingUploads: [...prev.pendingUploads, pendingUpload],
    }));

    // Convert to base64 for temporary display
    const base64 = await photoService.blobToBase64(compressedBlob);
    onPhotoAdded(base64);
    setPreview(null);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCameraCapture}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Camera</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFileUpload}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {preview && (
        <div className="absolute z-10 top-full mt-2 left-0">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded shadow-lg"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-1 left-0 right-0 text-xs text-red-600">
          {error}
        </div>
      )}

      {flowState.pendingUploads.filter(
        (u) => u.entityType === entityType && u.entityId === entityId
      ).length > 0 && (
        <div className="absolute top-full mt-1 left-0 text-xs text-yellow-600">
          {flowState.pendingUploads.filter(
            (u) => u.entityType === entityType && u.entityId === entityId
          ).length}{' '}
          photo(s) pending upload
        </div>
      )}
    </div>
  );
};