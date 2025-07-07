import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';
import { 
  activationValidationRateLimit,
  activationUsageRateLimit 
} from '../middleware/rateLimiter.middleware';
import { 
  bruteForcProtection,
  codeShareDetection,
  auditLog
} from '../middleware/activationSecurity.middleware';
import {
  auditActivationValidate,
  auditActivationUse,
  auditPaymentWebhook
} from '../middleware/auditLog.middleware';

const router = Router();

// Public webhook endpoints (no auth required, but signature verification is done in controller)
router.post('/webhooks/:provider', 
  auditPaymentWebhook,
  paymentController.handlePaymentWebhook
);

// Public activation endpoints with security middleware
router.post('/activation/validate', 
  activationValidationRateLimit,
  bruteForcProtection,
  codeShareDetection,
  auditActivationValidate,
  auditLog('activation_validate'),
  paymentController.validateActivationCode
);

router.get('/activation/status/:code', 
  paymentController.getActivationCodeStatus
);

// Protected activation endpoint (used by onboarding portal) with security
router.post('/activation/use', 
  authenticateToken,
  activationUsageRateLimit,
  bruteForcProtection,
  auditActivationUse,
  auditLog('activation_use'),
  paymentController.useActivationCode
);

// Admin endpoints
router.post('/admin/activation-codes', authenticateToken, isAdmin, paymentController.createActivationCode);
router.get('/admin/payment-logs', authenticateToken, isAdmin, paymentController.getPaymentLogs);

export default router;