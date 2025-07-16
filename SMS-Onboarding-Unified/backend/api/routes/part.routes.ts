// Parts management routes
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as partController from '../controllers/part.controller';
import { UserRole } from '../../types/auth';
import { PartCategory, CriticalLevel } from '../../types/entities';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /parts/:partId
router.get(
  '/:partId',
  authenticate,
  [param('partId').isUUID()],
  validateRequest,
  partController.getPart
);

// PATCH /parts/:partId
router.patch(
  '/:partId',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN]),
  [
    param('partId').isUUID(),
    body('name').optional().trim(),
    body('category').optional().isIn(Object.values(PartCategory)),
    body('criticalLevel').optional().isIn(Object.values(CriticalLevel)),
    body('currentStock').optional().isInt({ min: 0 }),
    body('minimumStock').optional().isInt({ min: 0 }),
    body('maximumStock').optional().isInt({ min: 0 }),
    body('reorderPoint').optional().isInt({ min: 0 }),
    body('unitPrice').optional().isFloat({ min: 0 }),
    body('currency').optional().matches(/^[A-Z]{3}$/),
    body('leadTimeDays').optional().isInt({ min: 0 }),
    body('specifications').optional().isObject(),
  ],
  validateRequest,
  partController.updatePart
);

// DELETE /parts/:partId
router.delete(
  '/:partId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [param('partId').isUUID()],
  validateRequest,
  partController.deletePart
);

// POST /parts/cross-reference
router.post(
  '/cross-reference',
  authenticate,
  [
    body('partNumber').notEmpty().trim(),
    body('manufacturer').optional().trim(),
    body('vesselId').optional().isUUID(),
  ],
  validateRequest,
  partController.crossReferenceParts
);

export default router;