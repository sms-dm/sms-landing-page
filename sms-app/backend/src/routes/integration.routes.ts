import { Router } from 'express';
import * as integrationController from '../controllers/integration.controller';
import { authMiddleware as authenticate } from '../middleware/auth.middleware';

const router = Router();

// All integration routes require authentication and admin/manager role
// In production, you might want to use API keys or webhook signatures instead

// Import vessel and equipment data from onboarding portal
router.post(
  '/import/vessel',
  authenticate,
  (req, res, next) => {
    // Check if user has admin or manager role
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  integrationController.importFromOnboarding
);

// Import users from onboarding portal
router.post(
  '/import/users',
  authenticate,
  (req, res, next) => {
    // Only admins can import users
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can import users' });
    }
    next();
  },
  integrationController.importUsers
);

// Get import status (for future webhook implementation)
router.get(
  '/import/status/:importId',
  authenticate,
  integrationController.getImportStatus
);

// Health check for integration
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SMS Maintenance Portal Integration',
    timestamp: new Date().toISOString()
  });
});

export default router;