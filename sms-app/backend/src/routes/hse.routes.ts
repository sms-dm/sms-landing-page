import { Router } from 'express';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.middleware';
import { 
  canCreateHseMiddleware,
  canViewAcknowledgmentsMiddleware,
  canEditHseMiddleware,
  canSendRemindersMiddleware,
  canExportReportsMiddleware,
  checkHseScopeAccessMiddleware
} from '../middleware/hsePermissions.middleware';
import { canCreateHSEUpdateMiddleware } from '../middleware/permissions.middleware';
import { HseController } from '../controllers/hse.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get HSE updates
router.get('/updates', HseController.getHseUpdates);

// Get specific HSE update
router.get('/updates/:updateId', 
  checkHseScopeAccessMiddleware,
  HseController.getHseUpdate
);

// Create HSE update - use enhanced permission check
router.post('/updates', 
  canCreateHSEUpdateMiddleware,
  HseController.createHseUpdate
);

// Update HSE update
router.put('/updates/:updateId', 
  canEditHseMiddleware,
  HseController.updateHseUpdate
);

// Acknowledge HSE update
router.post('/updates/:updateId/acknowledge', 
  checkHseScopeAccessMiddleware,
  HseController.acknowledgeHseUpdate
);

// Get acknowledgment statistics
router.get('/updates/:updateId/acknowledgments/stats', 
  canViewAcknowledgmentsMiddleware,
  HseController.getAcknowledgmentStats
);

// Get non-acknowledged users
router.get('/updates/:updateId/non-acknowledged', 
  canViewAcknowledgmentsMiddleware,
  HseController.getNonAcknowledgedUsers
);

// Send acknowledgment reminder
router.post('/updates/:updateId/remind', 
  canSendRemindersMiddleware,
  HseController.sendAcknowledgmentReminder
);

// Get HSE statistics
router.get('/statistics', 
  roleMiddleware(['hse', 'hse_manager', 'admin', 'manager']),
  HseController.getHseStatistics
);

// Export HSE report
router.get('/export', 
  canExportReportsMiddleware,
  HseController.exportHseReport
);

export default router;