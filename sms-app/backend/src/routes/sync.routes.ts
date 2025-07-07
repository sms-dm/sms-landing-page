import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  triggerSync,
  getSyncStatus,
  getSyncHistory,
  handleWebhook,
  getWebhookEvents,
  getSyncQueue,
  configureSyncSettings,
  testSyncConnection,
  syncUpdates
} from '../controllers/sync.controller';

const router = Router();

// Public webhook endpoint (no auth required for webhooks from onboarding portal)
router.post('/webhook', handleWebhook);

// SSE endpoint for real-time updates
router.get('/updates', authMiddleware, syncUpdates);

// Protected endpoints (require authentication)
router.use(authMiddleware);

// Sync operations
router.post('/trigger', triggerSync);
router.get('/status/:syncId?', getSyncStatus);
router.get('/history', getSyncHistory);

// Webhook management
router.get('/webhooks', getWebhookEvents);

// Sync queue
router.get('/queue/:syncLogId?', getSyncQueue);

// Configuration
router.post('/settings', configureSyncSettings);
router.get('/test-connection', testSyncConnection);

export default router;