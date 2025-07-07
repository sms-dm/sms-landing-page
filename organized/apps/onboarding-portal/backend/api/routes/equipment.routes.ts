// Equipment management routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as equipmentController from '../controllers/equipment.controller';
import * as partController from '../controllers/part.controller';
import { UserRole } from '../../types/auth';
import { EquipmentType, EquipmentStatus, CriticalLevel, EquipmentClassification } from '../../types/entities';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /equipment/:equipmentId
router.get(
  '/:equipmentId',
  authenticate,
  [param('equipmentId').isUUID()],
  validateRequest,
  equipmentController.getEquipment
);

// PATCH /equipment/:equipmentId
router.patch(
  '/:equipmentId',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.MANAGER]),
  [
    param('equipmentId').isUUID(),
    body('name').optional().trim(),
    body('type').optional().isIn(Object.values(EquipmentType)),
    body('manufacturer').optional().trim(),
    body('model').optional().trim(),
    body('serialNumber').optional().trim(),
    body('location').optional().trim(),
    body('installationDate').optional().isISO8601(),
    body('lastMaintenanceDate').optional().isISO8601(),
    body('nextMaintenanceDate').optional().isISO8601(),
    body('status').optional().isIn(Object.values(EquipmentStatus)),
    body('criticalLevel').optional().isIn(Object.values(CriticalLevel)),
    body('classification').optional().isIn(Object.values(EquipmentClassification)),
    body('technicalSpecs').optional().isObject(),
  ],
  validateRequest,
  equipmentController.updateEquipment
);

// DELETE /equipment/:equipmentId
router.delete(
  '/:equipmentId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [param('equipmentId').isUUID()],
  validateRequest,
  equipmentController.deleteEquipment
);

// POST /equipment/:equipmentId/verify
router.post(
  '/:equipmentId/verify',
  authenticate,
  authorize([UserRole.MANAGER]),
  [
    param('equipmentId').isUUID(),
    body('qualityScore').isInt({ min: 0, max: 100 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  equipmentController.verifyEquipment
);

// GET /equipment/:equipmentId/parts
router.get(
  '/:equipmentId/parts',
  authenticate,
  [
    param('equipmentId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('criticalLevel').optional().isIn(Object.values(CriticalLevel)),
    query('lowStock').optional().isBoolean(),
  ],
  validateRequest,
  partController.listPartsByEquipment
);

// POST /equipment/:equipmentId/parts
router.post(
  '/:equipmentId/parts',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN]),
  [
    param('equipmentId').isUUID(),
    body('name').notEmpty().trim(),
    body('partNumber').notEmpty().trim(),
    body('manufacturer').notEmpty().trim(),
    body('model').optional().trim(),
    body('category').notEmpty(),
    body('criticalLevel').isIn(Object.values(CriticalLevel)),
    body('currentStock').isInt({ min: 0 }),
    body('minimumStock').isInt({ min: 0 }),
    body('maximumStock').optional().isInt({ min: 0 }),
    body('reorderPoint').isInt({ min: 0 }),
    body('unitPrice').optional().isFloat({ min: 0 }),
    body('currency').optional().matches(/^[A-Z]{3}$/),
    body('leadTimeDays').optional().isInt({ min: 0 }),
    body('suppliers').optional().isArray(),
    body('suppliers.*.name').notEmpty().trim(),
    body('suppliers.*.contact.email').isEmail(),
    body('suppliers.*.contact.phone').notEmpty(),
    body('suppliers.*.leadTimeDays').isInt({ min: 0 }),
    body('suppliers.*.pricePerUnit').isFloat({ min: 0 }),
    body('suppliers.*.currency').matches(/^[A-Z]{3}$/),
    body('alternativeParts').optional().isArray(),
    body('alternativeParts.*.partNumber').notEmpty(),
    body('alternativeParts.*.manufacturer').notEmpty(),
    body('alternativeParts.*.compatibility').notEmpty(),
    body('specifications').optional().isObject(),
  ],
  validateRequest,
  partController.createPart
);

// POST /equipment/:equipmentId/transfer
router.post(
  '/:equipmentId/transfer',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    param('equipmentId').isUUID(),
    body('toVesselId').isUUID(),
    body('toLocationId').optional().isUUID(),
    body('reason').notEmpty().trim(),
    body('notes').optional().trim(),
  ],
  validateRequest,
  equipmentController.transferEquipment
);

// GET /equipment/:equipmentId/transfers
router.get(
  '/:equipmentId/transfers',
  authenticate,
  [
    param('equipmentId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  equipmentController.getEquipmentTransferHistory
);

export default router;