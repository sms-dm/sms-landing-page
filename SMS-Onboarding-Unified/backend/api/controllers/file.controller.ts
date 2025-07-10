import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '../../services/prisma';
import { s3Service } from '../../services/s3.service';
import { logger } from '../../services/logger.service';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
  };
}

// Upload single file
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { type, entityType, entityId, description } = req.body;
    const file = req.file;
    const user = req.user;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Generate unique key for the file
    const fileExtension = path.extname(file.originalname);
    const fileKey = `${entityType}/${entityId}/${type}/${uuidv4()}${fileExtension}`;

    // Upload file to S3 or local storage
    const fileUrl = await s3Service.uploadFile(file, fileKey);

    // Save file metadata to database
    const document = await prisma.document.create({
      data: {
        fileName: file.originalname,
        fileUrl,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: type.toUpperCase(),
        entityType,
        entityId,
        description,
        uploadedBy: user?.id,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date(),
          uploadedBy: user?.id,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user!.companyId,
        userId: user?.id,
        entityType: 'document',
        entityId: document.id,
        action: 'CREATE',
        newValues: document,
        metadata: { fileKey, entityType, entityId },
      },
    });

    logger.info(`File uploaded successfully: ${document.id}`);

    res.status(201).json({
      data: document,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

// Batch upload multiple files
export const batchUploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const metadata = JSON.parse(req.body.metadata);
    const user = req.user;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const uploadResults = await Promise.allSettled(
      files.map(async (file, index) => {
        const fileMeta = metadata[index] || {};
        const { type, entityType, entityId, description } = fileMeta;

        // Generate unique key for the file
        const fileExtension = path.extname(file.originalname);
        const fileKey = `${entityType}/${entityId}/${type}/${uuidv4()}${fileExtension}`;

        // Upload file to S3 or local storage
        const fileUrl = await s3Service.uploadFile(file, fileKey);

        // Save file metadata to database
        const document = await prisma.document.create({
          data: {
            fileName: file.originalname,
            fileUrl,
            fileKey,
            fileSize: file.size,
            mimeType: file.mimetype,
            type: type?.toUpperCase() || 'OTHER',
            entityType,
            entityId,
            description,
            uploadedBy: user?.id,
            metadata: {
              originalName: file.originalname,
              uploadedAt: new Date(),
              uploadedBy: user?.id,
              batchUpload: true,
            },
          },
        });

        return document;
      })
    );

    // Separate successful and failed uploads
    const successful = uploadResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = uploadResults
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        fileName: files[index].originalname,
        error: (result as PromiseRejectedResult).reason.message,
      }));

    // Create audit log for batch upload
    if (successful.length > 0) {
      await prisma.auditLog.create({
        data: {
          companyId: user!.companyId,
          userId: user?.id,
          entityType: 'document',
          entityId: successful[0].id,
          action: 'BATCH_CREATE',
          newValues: { documentIds: successful.map(doc => doc.id) },
          metadata: { 
            totalFiles: files.length,
            successful: successful.length,
            failed: failed.length,
          },
        },
      });
    }

    logger.info(`Batch upload completed: ${successful.length} successful, ${failed.length} failed`);

    res.status(201).json({
      data: {
        successful,
        failed,
      },
      message: `Uploaded ${successful.length} files successfully`,
    });
  } catch (error) {
    logger.error('Error in batch upload:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
};

// Get file details
export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: {
        uploadedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access permissions based on entity type
    if (document.entityType === 'vessel') {
      const vessel = await prisma.vessel.findFirst({
        where: {
          id: document.entityId,
          companyId: user!.companyId,
        },
      });

      if (!vessel) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (document.entityType === 'equipment') {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: document.entityId,
          vessel: {
            companyId: user!.companyId,
          },
        },
      });

      if (!equipment) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ data: document });
  } catch (error) {
    logger.error('Error fetching file:', error);
    res.status(500).json({ message: 'Error fetching file' });
  }
};

// Delete file
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const document = await prisma.document.findUnique({
      where: { id: fileId },
    });

    if (!document) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions (only uploader or admin can delete)
    if (document.uploadedBy !== user?.id && user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from storage
    await s3Service.deleteFile(document.fileKey);

    // Delete from database
    await prisma.document.delete({
      where: { id: fileId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user!.companyId,
        userId: user?.id,
        entityType: 'document',
        entityId: fileId,
        action: 'DELETE',
        oldValues: document,
        metadata: { fileKey: document.fileKey },
      },
    });

    logger.info(`File deleted successfully: ${fileId}`);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};

// Get file download URL
export const getFileDownloadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 3600 } = req.query;
    const user = req.user;

    const document = await prisma.document.findUnique({
      where: { id: fileId },
    });

    if (!document) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access permissions based on entity type
    if (document.entityType === 'vessel') {
      const vessel = await prisma.vessel.findFirst({
        where: {
          id: document.entityId,
          companyId: user!.companyId,
        },
      });

      if (!vessel) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (document.entityType === 'equipment') {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: document.entityId,
          vessel: {
            companyId: user!.companyId,
          },
        },
      });

      if (!equipment) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Generate signed URL
    const downloadUrl = await s3Service.getSignedUrl(
      document.fileKey,
      parseInt(expiresIn.toString())
    );

    // Log download access
    logger.info(`File download URL generated: ${fileId} by user ${user?.id}`);

    res.json({
      data: {
        url: downloadUrl,
        expiresIn: parseInt(expiresIn.toString()),
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    logger.error('Error generating download URL:', error);
    res.status(500).json({ message: 'Error generating download URL' });
  }
};