// Offline synchronization routes
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import * as syncController from '../controllers/sync.controller';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /sync/push
router.post(
  '/push',
  authenticate,
  [
    body('changes').isArray().notEmpty(),
    body('changes.*.id').isUUID(),
    body('changes.*.entityType').isIn(['vessel', 'equipment', 'part']),
    body('changes.*.entityId').isUUID(),
    body('changes.*.action').isIn(['create', 'update', 'delete']),
    body('changes.*.data').isObject(),
    body('changes.*.timestamp').isISO8601(),
    body('changes.*.version').optional().isInt(),
    body('lastSyncTimestamp').isISO8601(),
    body('deviceId').optional().isString(),
  ],
  validateRequest,
  syncController.syncPush
);

// POST /sync/pull
router.post(
  '/pull',
  authenticate,
  [
    body('lastSyncTimestamp').isISO8601(),
    body('entityTypes').optional().isArray(),
    body('entityTypes.*').optional().isIn(['vessels', 'equipment', 'parts']),
    body('vesselIds').optional().isArray(),
    body('vesselIds.*').optional().isUUID(),
  ],
  validateRequest,
  syncController.syncPull
);

export default router;