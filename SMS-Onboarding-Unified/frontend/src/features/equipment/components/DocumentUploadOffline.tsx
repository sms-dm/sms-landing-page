import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useOfflineData } from '@/hooks/useOfflineData';
import { Documentation, DocumentationType } from '@/types';
import { 
  UploadIcon, 
  FileIcon, 
  XIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  WifiOffIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { toast } from '@/utils/toast';

interface DocumentUploadOfflineProps {
  equipmentId: string;
  onUploadComplete?: (document: Documentation) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
}

export const DocumentUploadOffline: React.FC<DocumentUploadOfflineProps> = ({
  equipmentId,
  onUploadComplete,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true
}) => {
  const { uploadDocument, isOffline } = useOfflineData();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; document?: Documentation; error?: string }>>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        // Add file to list with loading state
        setUploadedFiles(prev => [...prev, { file }]);
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Simulate upload progress for offline mode
        if (isOffline) {
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[file.name] || 0;
              if (current >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return { ...prev, [file.name]: current + 10 };
            });
          }, 100);
        }

        // Upload document
        const document = await uploadDocument(file, {
          type: file.type.startsWith('image/') ? DocumentationType.PHOTO : DocumentationType.OTHER,
          title: file.name,
          equipmentId
        });

        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Update file list with document
        setUploadedFiles(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, document } 
              : item
          )
        );

        if (onUploadComplete) {
          onUploadComplete(document);
        }

        toast({
          title: isOffline ? 'Saved Locally' : 'Upload Complete',
          description: isOffline 
            ? `${file.name} saved locally. Will upload when online.`
            : `${file.name} uploaded successfully.`,
          variant: isOffline ? 'warning' : 'success'
        });

      } catch (error) {
        console.error('Upload error:', error);
        
        // Update file list with error
        setUploadedFiles(prev => 
          prev.map(item => 
            item.file === file 
              ? { ...item, error: error instanceof Error ? error.message : 'Upload failed' } 
              : item
          )
        );

        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: 'destructive'
        });
      }
    }

    setUploading(false);
  }, [equipmentId, uploadDocument, onUploadComplete, isOffline]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: uploading
  });

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(item => item.file !== file));
    setUploadProgress(prev => {
      const { [file.name]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Max file size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
        {isOffline && (
          <div className="flex items-center justify-center gap-1 mt-3 text-yellow-600">
            <WifiOffIcon className="w-4 h-4" />
            <span className="text-xs">Files will be uploaded when online</span>
          </div>
        )}
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Progress or status */}
                {uploadProgress[item.file.name] !== undefined && uploadProgress[item.file.name] < 100 ? (
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress[item.file.name]}%` }}
                      />
                    </div>
                  </div>
                ) : item.error ? (
                  <AlertCircleIcon className="w-5 h-5 text-red-500" />
                ) : item.document ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : null}

                {/* Remove button */}
                <button
                  onClick={() => removeFile(item.file)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  disabled={uploadProgress[item.file.name] !== undefined && uploadProgress[item.file.name] < 100}
                >
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};