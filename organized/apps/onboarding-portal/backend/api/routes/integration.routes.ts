// Integration routes for maintenance portal
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as integrationController from '../controllers/integration.controller';
import { UserRole } from '../../types/auth';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /integration/maintenance-portal/export
router.post(
  '/maintenance-portal/export',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    body('vesselId').isUUID(),
    body('includePhotos').optional().isBoolean(),
    body('format').optional().isIn(['json', 'xml', 'csv']),
  ],
  validateRequest,
  integrationController.exportToMaintenance
);

// POST /integration/maintenance-portal/sync-users
router.post(
  '/maintenance-portal/sync-users',
  authenticate,
  authorize([UserRole.ADMIN]),
  [body('companyId').optional().isUUID()],
  validateRequest,
  integrationController.syncUsers
);

// POST /integration/webhooks/progress
router.post(
  '/webhooks/progress',
  // Webhook authentication is handled differently
  integrationController.handleProgressWebhook
);

export default router;