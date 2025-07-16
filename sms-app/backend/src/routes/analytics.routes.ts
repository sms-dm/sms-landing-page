import { Router } from 'express';
import {
  getVesselAnalytics,
  getTechnicianAnalytics,
  getFleetAnalytics,
  getPerformanceTrends,
  getDashboardStats,
  updateEquipmentStatus
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard stats (real-time calculations)
router.get('/dashboard/stats', getDashboardStats);

// Vessel analytics
router.get('/vessel/:vesselId', getVesselAnalytics);

// Technician analytics
router.get('/technician/:technicianId', getTechnicianAnalytics);

// Fleet analytics (managers only)
router.get('/fleet', requireRole(['admin', 'manager']), getFleetAnalytics);

// Performance trends
router.get('/trends/:entityType/:entityId/:metric', getPerformanceTrends);

// Update equipment status (for uptime tracking)
router.patch('/equipment/:equipmentId/status', updateEquipmentStatus);

export default router;