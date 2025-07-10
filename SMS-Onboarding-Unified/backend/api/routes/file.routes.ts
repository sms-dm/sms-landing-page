// File management routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import * as fileController from '../controllers/file.controller';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /files/upload
router.post(
  '/upload',
  authenticate,
  uploadSingle('file'),
  [
    body('type').isIn(['photo', 'document', 'logo']),
    body('entityType').isIn(['company', 'vessel', 'equipment', 'part']),
    body('entityId').isUUID(),
    body('description').optional().trim(),
  ],
  validateRequest,
  fileController.uploadFile
);

// POST /files/batch-upload
router.post(
  '/batch-upload',
  authenticate,
  uploadMultiple('files', 10), // Max 10 files at once
  [
    body('metadata').isJSON(),
  ],
  validateRequest,
  fileController.batchUploadFiles
);

// GET /files/:fileId
router.get(
  '/:fileId',
  authenticate,
  [param('fileId').isUUID()],
  validateRequest,
  fileController.getFile
);

// DELETE /files/:fileId
router.delete(
  '/:fileId',
  authenticate,
  [param('fileId').isUUID()],
  validateRequest,
  fileController.deleteFile
);

// GET /files/:fileId/download
router.get(
  '/:fileId/download',
  authenticate,
  [
    param('fileId').isUUID(),
    query('expiresIn').optional().isInt({ min: 60, max: 86400 }), // 1 minute to 24 hours
  ],
  validateRequest,
  fileController.getFileDownloadUrl
);

export default router;