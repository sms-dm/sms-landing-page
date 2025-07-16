import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export class FileStorageService {
  private useLocal: boolean;
  private localStoragePath: string;
  private baseUrl: string;

  constructor() {
    // For now, always use local storage
    // Later can be configured to use S3 based on environment
    this.useLocal = true;
    this.localStoragePath = path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3005';
    
    // Ensure upload directory exists
    this.ensureLocalDirectory();
  }

  private async ensureLocalDirectory() {
    try {
      await mkdir(this.localStoragePath, { recursive: true });
      // Ensure subdirectories exist
      await mkdir(path.join(this.localStoragePath, 'equipment'), { recursive: true });
      await mkdir(path.join(this.localStoragePath, 'documents'), { recursive: true });
      await mkdir(path.join(this.localStoragePath, 'temp'), { recursive: true });
    } catch (error) {
      console.error('Failed to create local storage directories:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    category: 'equipment' | 'documents' | 'temp' = 'documents'
  ): Promise<FileUploadResult> {
    try {
      // Generate unique filename
      const fileId = uuidv4();
      const fileExt = path.extname(file.originalname);
      const filename = `${fileId}${fileExt}`;
      const filePath = path.join(category, filename);
      
      if (this.useLocal) {
        // Local file storage
        const fullPath = path.join(this.localStoragePath, filePath);
        await writeFile(fullPath, file.buffer);
        
        return {
          id: fileId,
          filename,
          originalName: file.originalname,
          path: filePath,
          url: `/uploads/${filePath}`,
          size: file.size,
          mimeType: file.mimetype
        };
      } else {
        // TODO: Implement S3 upload
        // For now, throw error
        throw new Error('S3 storage not yet implemented');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFile(filePath: string): Promise<Buffer> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localStoragePath, filePath);
        return await readFile(fullPath);
      } else {
        // TODO: Implement S3 download
        throw new Error('S3 storage not yet implemented');
      }
    } catch (error) {
      console.error('File retrieval failed:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (this.useLocal) {
        const fullPath = path.join(this.localStoragePath, filePath);
        await unlink(fullPath);
      } else {
        // TODO: Implement S3 delete
        throw new Error('S3 storage not yet implemented');
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error('Failed to delete file');
    }
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      if (this.useLocal) {
        const oldFullPath = path.join(this.localStoragePath, oldPath);
        const newFullPath = path.join(this.localStoragePath, newPath);
        
        // Ensure directory exists
        const newDir = path.dirname(newFullPath);
        await mkdir(newDir, { recursive: true });
        
        // Move file
        await promisify(fs.rename)(oldFullPath, newFullPath);
      } else {
        // TODO: Implement S3 move/copy
        throw new Error('S3 storage not yet implemented');
      }
    } catch (error) {
      console.error('File move failed:', error);
      throw new Error('Failed to move file');
    }
  }

  getFileUrl(filePath: string): string {
    if (this.useLocal) {
      return `${this.baseUrl}/uploads/${filePath}`;
    } else {
      // TODO: Return S3 URL or signed URL
      return '';
    }
  }

  // Method to prepare for S3 migration
  async prepareForS3Migration(): Promise<{
    localFiles: string[];
    totalSize: number;
  }> {
    // TODO: Scan local files and prepare migration plan
    return {
      localFiles: [],
      totalSize: 0
    };
  }
}

export const fileStorageService = new FileStorageService();