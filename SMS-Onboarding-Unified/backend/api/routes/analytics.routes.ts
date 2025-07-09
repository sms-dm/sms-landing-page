// Analytics and reporting routes
import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as analyticsController from '../controllers/analytics.controller';
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

// GET /analytics/quality-scores
router.get(
  '/quality-scores',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    query('vesselId').optional().isUUID(),
    query('companyId').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validateRequest,
  analyticsController.getQualityScores
);

// GET /analytics/onboarding-metrics
router.get(
  '/onboarding-metrics',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    query('companyId').optional().isUUID(),
    query('period').optional().isIn(['day', 'week', 'month', 'quarter', 'year']),
  ],
  validateRequest,
  analyticsController.getOnboardingMetrics
);

export default router;