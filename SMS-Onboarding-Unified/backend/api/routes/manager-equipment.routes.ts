import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as managerEquipmentController from '../controllers/manager-equipment.controller';
import { UserRole } from '../../types/auth';
import { EquipmentType, EquipmentStatus, CriticalLevel } from '../../types/entities';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All routes require authentication and manager/admin role
router.use(authenticate);
router.use(authorize([UserRole.MANAGER, UserRole.ADMIN]));

// GET /manager/equipment
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('vesselId').optional().isUUID(),
    query('status').optional().isIn(Object.values(EquipmentStatus)),
    query('criticalLevel').optional().isIn(Object.values(CriticalLevel)),
    query('location').optional().isUUID(),
    query('assignedTo').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('sort').optional().matches(/^[a-zA-Z_]+:(asc|desc)$/)
  ],
  validateRequest,
  managerEquipmentController.listManagerEquipment
);

// POST /manager/equipment/bulk-create
router.post(
  '/bulk-create',
  [
    body('vesselId').isUUID(),
    body('equipment').isArray({ min: 1 }),
    body('equipment.*.name').notEmpty().trim(),
    body('equipment.*.type').isIn(Object.values(EquipmentType)),
    body('equipment.*.manufacturer').notEmpty().trim(),
    body('equipment.*.model').notEmpty().trim(),
    body('equipment.*.serialNumber').optional().trim(),
    body('equipment.*.locationId').optional().isUUID(),
    body('equipment.*.criticality').isIn(Object.values(CriticalLevel)),
    body('equipment.*.status').optional().isIn(Object.values(EquipmentStatus)),
    body('equipment.*.installationDate').optional().isISO8601(),
    body('equipment.*.assignedTo').optional().isUUID(),
    body('equipment.*.metadata').optional().isObject()
  ],
  validateRequest,
  managerEquipmentController.createManagerEquipment
);

// PATCH /manager/equipment/:equipmentId
router.patch(
  '/:equipmentId',
  [
    param('equipmentId').isUUID(),
    body('name').optional().trim(),
    body('type').optional().isIn(Object.values(EquipmentType)),
    body('manufacturer').optional().trim(),
    body('model').optional().trim(),
    body('serialNumber').optional().trim(),
    body('locationId').optional().isUUID(),
    body('criticality').optional().isIn(Object.values(CriticalLevel)),
    body('status').optional().isIn(Object.values(EquipmentStatus)),
    body('installationDate').optional().isISO8601(),
    body('warrantyExpiry').optional().isISO8601(),
    body('maintenanceIntervalDays').optional().isInt({ min: 1 }),
    body('lastMaintenanceDate').optional().isISO8601(),
    body('nextMaintenanceDate').optional().isISO8601(),
    body('specifications').optional().isObject(),
    body('metadata').optional().isObject()
  ],
  validateRequest,
  managerEquipmentController.updateManagerEquipment
);

// PATCH /manager/equipment/bulk-update
router.patch(
  '/bulk-update',
  [
    body('equipmentIds').isArray({ min: 1 }),
    body('equipmentIds.*').isUUID(),
    body('updates').isObject(),
    body('updates.status').optional().isIn(Object.values(EquipmentStatus)),
    body('updates.criticality').optional().isIn(Object.values(CriticalLevel)),
    body('updates.locationId').optional().isUUID(),
    body('updates.metadata').optional().isObject()
  ],
  validateRequest,
  managerEquipmentController.bulkUpdateEquipment
);

// DELETE /manager/equipment/:equipmentId
router.delete(
  '/:equipmentId',
  [param('equipmentId').isUUID()],
  validateRequest,
  managerEquipmentController.deleteManagerEquipment
);

// DELETE /manager/equipment/bulk-delete
router.delete(
  '/bulk-delete',
  [
    body('equipmentIds').isArray({ min: 1 }),
    body('equipmentIds.*').isUUID()
  ],
  validateRequest,
  managerEquipmentController.bulkDeleteEquipment
);

// POST /manager/equipment/assign
router.post(
  '/assign',
  [
    body('equipmentIds').isArray({ min: 1 }),
    body('equipmentIds.*').isUUID(),
    body('assignToId').isUUID()
  ],
  validateRequest,
  managerEquipmentController.assignEquipment
);

// GET /manager/equipment/stats
router.get(
  '/stats',
  [
    query('vesselId').optional().isUUID()
  ],
  validateRequest,
  managerEquipmentController.getEquipmentStats
);

export default router;