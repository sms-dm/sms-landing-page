import { Router } from 'express';
import * as authBridgeController from '../controllers/auth-bridge.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validate a bridge token from the Onboarding portal
// This endpoint doesn't require authentication as it's receiving users from the other portal
router.post('/validate', authBridgeController.validateBridgeToken);

// Generate a bridge token for authenticated users to go to Onboarding portal
// This requires authentication as we're sending our users to the other portal
router.post('/generate', authMiddleware, authBridgeController.generateBridgeToken);

// Health check for bridge functionality
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Authentication Bridge',
    timestamp: new Date().toISOString()
  });
});

export default router;