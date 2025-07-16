// Technician-specific routes
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../../types/auth';
import * as equipmentController from '../controllers/equipment.controller';
import * as partController from '../controllers/part.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(authorize([UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.MANAGER]));

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /technician/assignments
router.get('/assignments', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock implementation - replace with actual database query
    const assignments = [
      {
        id: '1',
        vesselId: 'vessel-1',
        vesselName: 'MV Test Vessel',
        assignedAt: new Date(),
        status: 'in_progress',
        completionPercentage: 45,
      },
    ];
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /technician/assignments/:assignmentId
router.get('/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Mock implementation
    const assignment = {
      id: assignmentId,
      vesselId: 'vessel-1',
      vesselName: 'MV Test Vessel',
      assignedAt: new Date(),
      status: 'in_progress',
      completionPercentage: 45,
      details: {
        totalEquipment: 50,
        completedEquipment: 22,
        pendingReview: 5,
      },
    };
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /technician/assignments/:assignmentId/start
router.post(
  '/assignments/:assignmentId/start',
  [param('assignmentId').notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      
      // Mock implementation
      const assignment = {
        id: assignmentId,
        status: 'in_progress',
        startedAt: new Date(),
      };
      
      res.json(assignment);
    } catch (error) {
      console.error('Error starting assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /technician/assignments/:assignmentId/complete
router.post(
  '/assignments/:assignmentId/complete',
  [param('assignmentId').notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      
      // Mock implementation
      const assignment = {
        id: assignmentId,
        status: 'completed',
        completedAt: new Date(),
      };
      
      res.json(assignment);
    } catch (error) {
      console.error('Error completing assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /vessels/:vesselId/locations
router.get('/vessels/:vesselId/locations', async (req, res) => {
  try {
    const { vesselId } = req.params;
    
    // Mock implementation
    const locations = [
      {
        id: 'loc-1',
        vesselId,
        name: 'Engine Room',
        deck: 'Lower Deck',
        frame: '45-50',
        description: 'Main engine compartment',
      },
      {
        id: 'loc-2',
        vesselId,
        name: 'Bridge',
        deck: 'Navigation Deck',
        frame: '120-125',
        description: 'Navigation and control center',
      },
    ];
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /vessels/:vesselId/locations
router.post(
  '/vessels/:vesselId/locations',
  [
    param('vesselId').notEmpty(),
    body('name').notEmpty().trim(),
    body('deck').notEmpty().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { vesselId } = req.params;
      const locationData = req.body;
      
      // Mock implementation
      const location = {
        id: `loc-${Date.now()}`,
        vesselId,
        ...locationData,
        createdAt: new Date(),
      };
      
      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /locations/:locationId/equipment
router.get(
  '/locations/:locationId/equipment',
  [param('locationId').notEmpty()],
  validateRequest,
  equipmentController.getLocationEquipment
);

// POST /locations/:locationId/equipment
router.post(
  '/locations/:locationId/equipment',
  [
    param('locationId').notEmpty(),
    body('name').notEmpty().trim(),
    body('manufacturer').notEmpty().trim(),
    body('model').notEmpty().trim(),
    body('serialNumber').notEmpty().trim(),
    body('categoryId').notEmpty(),
    body('criticalityLevel').notEmpty(),
  ],
  validateRequest,
  equipmentController.createEquipment
);

// GET /equipment/:equipmentId/parts
router.get(
  '/equipment/:equipmentId/parts',
  [param('equipmentId').notEmpty()],
  validateRequest,
  partController.listPartsByEquipment
);

// POST /equipment/:equipmentId/parts
router.post(
  '/equipment/:equipmentId/parts',
  [
    param('equipmentId').notEmpty(),
    body('partNumber').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('quantity').isInt({ min: 0 }),
    body('minimumStock').isInt({ min: 0 }),
  ],
  validateRequest,
  partController.createPart
);

// POST /parts/:partId/mark-critical
router.post(
  '/parts/:partId/mark-critical',
  [
    param('partId').notEmpty(),
    body('reason').notEmpty().trim(),
  ],
  validateRequest,
  partController.markPartAsCritical
);

// GET /vessels/:vesselId/quality-score
router.get('/vessels/:vesselId/quality-score', async (req, res) => {
  try {
    const { vesselId } = req.params;
    const { getVesselQualityScore } = await import('../../services/quality.service');
    
    const qualityScore = await getVesselQualityScore(vesselId);
    res.json(qualityScore);
  } catch (error) {
    console.error('Error fetching quality score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:entityType/:entityId/photos
router.post(
  '/:entityType/:entityId/photos',
  [
    param('entityType').isIn(['equipment', 'part', 'location']),
    param('entityId').notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      // Mock implementation - in production, handle file upload to S3
      const photoUrl = `https://storage.example.com/${entityType}/${entityId}/${Date.now()}.jpg`;
      
      res.json({ url: photoUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;