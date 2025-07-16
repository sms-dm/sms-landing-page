// Webhook routes for external integrations
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { validateWebhookSignature } from '../middleware/webhook.middleware';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /webhooks/progress
router.post(
  '/progress',
  validateWebhookSignature,
  [
    body('vesselId').isUUID(),
    body('event').isIn(['equipment.added', 'equipment.updated', 'equipment.verified', 'vessel.completed']),
    body('data').isObject(),
    body('timestamp').optional().isISO8601(),
  ],
  validateRequest,
  webhookController.handleProgressWebhook
);

// POST /webhooks/maintenance-sync
router.post(
  '/maintenance-sync',
  validateWebhookSignature,
  [
    body('action').isIn(['user.created', 'user.updated', 'user.deleted']),
    body('data').isObject(),
  ],
  validateRequest,
  webhookController.handleMaintenanceSync
);

// POST /webhooks/stock-update
router.post(
  '/stock-update',
  validateWebhookSignature,
  [
    body('partId').isUUID(),
    body('action').isIn(['stock.updated', 'order.placed', 'order.delivered']),
    body('data').isObject(),
  ],
  validateRequest,
  webhookController.handleStockUpdate
);

export default router;