// Batch operations routes
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as batchController from '../controllers/batch.controller';
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

// POST /batch/equipment
router.post(
  '/equipment',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN]),
  [
    body('operations').isArray({ min: 1, max: 100 }),
    body('operations.*.action').isIn(['create', 'update', 'delete']),
    body('operations.*.data').optional().isObject(),
    body('operations.*.equipmentId').optional().isUUID(),
  ],
  validateRequest,
  batchController.batchEquipment
);

// POST /batch/parts
router.post(
  '/parts',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN]),
  [
    body('operations').isArray({ min: 1, max: 100 }),
    body('operations.*.action').isIn(['create', 'update', 'delete']),
    body('operations.*.data').optional().isObject(),
    body('operations.*.partId').optional().isUUID(),
  ],
  validateRequest,
  batchController.batchParts
);

export default router;