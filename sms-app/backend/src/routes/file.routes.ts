import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload routes
router.post('/upload', uploadSingle, fileController.uploadSingle);
router.post('/upload-multiple', uploadMultiple, fileController.uploadMultiple);

// Delete route
router.delete('/:filename', fileController.deleteFile);

export default router;