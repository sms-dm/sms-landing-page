import { PhotoCaptureConfig, PendingUpload } from '../types';
import { v4 as uuidv4 } from 'uuid';

class PhotoService {
  private defaultConfig: PhotoCaptureConfig = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg',
  };

  // Compress image using canvas
  async compressImage(
    file: File,
    config: Partial<PhotoCaptureConfig> = {}
  ): Promise<Blob> {
    const settings = { ...this.defaultConfig, ...config };

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions
          let { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            settings.maxWidth,
            settings.maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Could not compress image'));
              }
            },
            `image/${settings.format}`,
            settings.quality
          );
        };
        img.onerror = () => reject(new Error('Could not load image'));
      };
      reader.onerror = () => reject(new Error('Could not read file'));
    });
  }

  // Calculate dimensions maintaining aspect ratio
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Create pending upload entry
  createPendingUpload(
    file: File,
    compressedFile: Blob,
    entityType: 'location' | 'equipment' | 'part',
    entityId: string
  ): PendingUpload {
    return {
      id: uuidv4(),
      type: 'photo',
      entityType,
      entityId,
      file,
      compressedFile,
      status: 'pending',
      retryCount: 0,
    };
  }

  // Get image dimensions
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Could not load image'));
      };
      reader.onerror = () => reject(new Error('Could not read file'));
    });
  }

  // Convert blob to base64 for offline storage
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }

  // Convert base64 to blob
  base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Check if file is valid image
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  // Get file size in MB
  getFileSizeMB(file: File | Blob): number {
    return file.size / (1024 * 1024);
  }
}

export const photoService = new PhotoService();