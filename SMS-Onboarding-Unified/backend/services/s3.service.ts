import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from './logger.service';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

export class S3Service {
  private s3Client: S3Client | null = null;
  private useLocal: boolean;
  private localStoragePath: string;

  constructor() {
    this.useLocal = !config.aws.accessKeyId || !config.aws.secretAccessKey || config.env === 'development';
    this.localStoragePath = path.join(process.cwd(), 'uploads');

    if (!this.useLocal) {
      this.s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId!,
          secretAccessKey: config.aws.secretAccessKey!,
        },
      });
    } else {
      // Ensure local upload directory exists
      this.ensureLocalDirectory();
    }
  }

  private async ensureLocalDirectory() {
    try {
      await mkdir(this.localStoragePath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create local storage directory:', error);
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    try {
      if (this.useLocal) {
        // Local file storage
        const localPath = path.join(this.localStoragePath, key);
        const dir = path.dirname(localPath);
        await mkdir(dir, { recursive: true });
        await writeFile(localPath, file.buffer);
        return `/uploads/${key}`;
      } else {
        // S3 upload
        const command = new PutObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
          },
        });

        await this.s3Client!.send(command);
        return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
      }
    } catch (error) {
      logger.error('File upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (this.useLocal) {
        // For local storage, return the direct URL
        return `/uploads/${key}`;
      } else {
        // Generate S3 signed URL
        const command = new GetObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
        });

        return await getSignedUrl(this.s3Client!, command, { expiresIn });
      }
    } catch (error) {
      logger.error('Failed to generate signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      if (this.useLocal) {
        // Delete local file
        const localPath = path.join(this.localStoragePath, key);
        await unlink(localPath);
      } else {
        // Delete from S3
        const command = new DeleteObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
        });

        await this.s3Client!.send(command);
      }
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw new Error('Failed to delete file');
    }
  }
}

export const s3Service = new S3Service();