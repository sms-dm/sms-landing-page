// Vessel management routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as vesselController from '../controllers/vessel.controller';
import * as equipmentController from '../controllers/equipment.controller';
import { UserRole } from '../../types/auth';
import { VesselType, VesselStatus, OnboardingStatus } from '../../types/entities';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /vessels
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('sort').optional().matches(/^[a-zA-Z_]+:(asc|desc)$/),
    query('companyId').optional().isUUID(),
    query('status').optional().isIn(Object.values(VesselStatus)),
    query('onboardingStatus').optional().isIn(Object.values(OnboardingStatus)),
  ],
  validateRequest,
  vesselController.listVessels
);

// POST /vessels
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  [
    body('companyId').isUUID(),
    body('name').notEmpty().trim(),
    body('imoNumber').matches(/^[0-9]{7}$/),
    body('flag').notEmpty().trim(),
    body('type').isIn(Object.values(VesselType)),
    body('yearBuilt').isInt({ min: 1900, max: new Date().getFullYear() }),
    body('grossTonnage').isNumeric(),
    body('deadWeight').optional().isNumeric(),
    body('length').optional().isNumeric(),
    body('beam').optional().isNumeric(),
    body('draft').optional().isNumeric(),
    body('mainEngine').optional().trim(),
    body('auxiliaryEngines').optional().isArray(),
    body('auxiliaryEngines.*').optional().isString(),
    body('classification').optional().trim(),
  ],
  validateRequest,
  vesselController.createVessel
);

// GET /vessels/:vesselId
router.get(
  '/:vesselId',
  authenticate,
  [param('vesselId').isUUID()],
  validateRequest,
  vesselController.getVessel
);

// PATCH /vessels/:vesselId
router.patch(
  '/:vesselId',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    param('vesselId').isUUID(),
    body('name').optional().trim(),
    body('flag').optional().trim(),
    body('type').optional().isIn(Object.values(VesselType)),
    body('status').optional().isIn(Object.values(VesselStatus)),
    body('mainEngine').optional().trim(),
    body('auxiliaryEngines').optional().isArray(),
    body('auxiliaryEngines.*').optional().isString(),
    body('classification').optional().trim(),
  ],
  validateRequest,
  vesselController.updateVessel
);

// DELETE /vessels/:vesselId
router.delete(
  '/:vesselId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [param('vesselId').isUUID()],
  validateRequest,
  vesselController.deleteVessel
);

// GET /vessels/:vesselId/onboarding-progress
router.get(
  '/:vesselId/onboarding-progress',
  authenticate,
  [param('vesselId').isUUID()],
  validateRequest,
  vesselController.getOnboardingProgress
);

// GET /vessels/:vesselId/equipment
router.get(
  '/:vesselId/equipment',
  authenticate,
  [
    param('vesselId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('sort').optional().matches(/^[a-zA-Z_]+:(asc|desc)$/),
    query('type').optional().isString(),
    query('status').optional().isString(),
    query('criticalLevel').optional().isString(),
    query('location').optional().isString(),
  ],
  validateRequest,
  equipmentController.listEquipmentByVessel
);

// POST /vessels/:vesselId/equipment
router.post(
  '/:vesselId/equipment',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.TECHNICIAN]),
  [
    param('vesselId').isUUID(),
    body('name').notEmpty().trim(),
    body('type').notEmpty(),
    body('manufacturer').notEmpty().trim(),
    body('model').notEmpty().trim(),
    body('serialNumber').optional().trim(),
    body('location').notEmpty().trim(),
    body('installationDate').optional().isISO8601(),
    body('criticalLevel').notEmpty(),
    body('status').optional().isString(),
    body('technicalSpecs').optional().isObject(),
  ],
  validateRequest,
  equipmentController.createEquipment
);

export default router;