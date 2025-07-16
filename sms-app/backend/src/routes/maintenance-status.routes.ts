import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  checkMaintenanceStatusComplete,
  bulkUpdateMaintenanceStatus,
  getEquipmentNeedingStatus
} from '../controllers/maintenance-status.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Check if user has completed maintenance status entry
router.get('/user/maintenance-status-complete', checkMaintenanceStatusComplete);

// Get equipment that needs status entry (specific endpoint to avoid conflict)
router.get('/equipment/needs-status', getEquipmentNeedingStatus);

// Bulk update equipment maintenance status
router.post('/equipment/bulk-maintenance-status', bulkUpdateMaintenanceStatus);

export default router;