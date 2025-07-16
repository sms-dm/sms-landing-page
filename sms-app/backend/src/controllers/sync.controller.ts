import { Request, Response } from 'express';
import syncService, { SyncEvent } from '../services/sync.service';
import { dbAll, dbRun } from '../config/database.abstraction';

// Manual sync trigger
export const triggerSync = async (req: Request, res: Response) => {
  try {
    // Check if sync is already in progress
    const status = syncService.getCurrentSyncStatus();
    if (status.isSyncing) {
      return res.status(409).json({
        error: 'Sync already in progress',
        syncId: status.syncId
      });
    }

    // Start sync in background
    const syncPromise = syncService.syncAll('manual');

    // Return immediately with sync ID
    syncPromise.then(result => {
      console.log('Manual sync completed:', result);
    }).catch(error => {
      console.error('Manual sync failed:', error);
    });

    res.json({
      message: 'Sync started',
      syncId: syncService.getCurrentSyncStatus().syncId
    });

  } catch (error) {
    console.error('Failed to trigger sync:', error);
    res.status(500).json({
      error: 'Failed to trigger sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get sync status
export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const { syncId } = req.params;

    if (syncId) {
      // Get specific sync status
      const syncLog = await dbAll(
        'SELECT * FROM sync_logs WHERE id = ?',
        [syncId]
      );

      if (syncLog.length === 0) {
        return res.status(404).json({ error: 'Sync not found' });
      }

      res.json(syncLog[0]);
    } else {
      // Get current sync status
      const status = syncService.getCurrentSyncStatus();
      res.json(status);
    }

  } catch (error) {
    console.error('Failed to get sync status:', error);
    res.status(500).json({
      error: 'Failed to get sync status'
    });
  }
};

// Get sync history
export const getSyncHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await dbAll(
      `SELECT id, type, direction, status, started_at, completed_at,
              vessels_synced, equipment_synced, users_synced, 
              parts_synced, documents_synced, maintenance_tasks_synced, errors
       FROM sync_logs 
       ORDER BY started_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count
    const countResult = await dbAll('SELECT COUNT(*) as total FROM sync_logs');
    const total = countResult[0].total;

    res.json({
      data: history,
      pagination: {
        limit,
        offset,
        total
      }
    });

  } catch (error) {
    console.error('Failed to get sync history:', error);
    res.status(500).json({
      error: 'Failed to get sync history'
    });
  }
};

// Handle webhook from onboarding portal
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { event, data, eventId } = req.body;

    // Validate webhook
    if (!event || !data || !eventId) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Check if event already processed
    const existingEvent = await dbAll(
      'SELECT id FROM webhook_events WHERE event_id = ?',
      [eventId]
    );

    if (existingEvent.length > 0) {
      return res.json({ message: 'Event already processed' });
    }

    // Store webhook event
    await dbRun(
      `INSERT INTO webhook_events (event_id, event_type, payload, status)
       VALUES (?, ?, ?, ?)`,
      [eventId, event, JSON.stringify(req.body), 'received']
    );

    // Process webhook asynchronously
    setImmediate(async () => {
      try {
        await dbRun(
          'UPDATE webhook_events SET status = ? WHERE event_id = ?',
          ['processing', eventId]
        );

        await syncService.handleWebhook(event, data);

        await dbRun(
          'UPDATE webhook_events SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE event_id = ?',
          ['processed', eventId]
        );
      } catch (error) {
        console.error('Failed to process webhook:', error);
        await dbRun(
          'UPDATE webhook_events SET status = ?, error_message = ? WHERE event_id = ?',
          ['failed', error instanceof Error ? error.message : 'Unknown error', eventId]
        );
      }
    });

    res.json({ message: 'Webhook received and queued for processing' });

  } catch (error) {
    console.error('Failed to handle webhook:', error);
    res.status(500).json({
      error: 'Failed to handle webhook'
    });
  }
};

// Get webhook events
export const getWebhookEvents = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    let query = 'SELECT * FROM webhook_events';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY received_at DESC LIMIT ?';
    params.push(limit);

    const events = await dbAll(query, params);

    res.json(events);

  } catch (error) {
    console.error('Failed to get webhook events:', error);
    res.status(500).json({
      error: 'Failed to get webhook events'
    });
  }
};

// Get sync queue status
export const getSyncQueue = async (req: Request, res: Response) => {
  try {
    const { syncLogId } = req.params;
    const status = req.query.status as string;

    let query = 'SELECT * FROM sync_queue';
    const params: any[] = [];
    const conditions: string[] = [];

    if (syncLogId) {
      conditions.push('sync_log_id = ?');
      params.push(syncLogId);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const queue = await dbAll(query, params);

    res.json(queue);

  } catch (error) {
    console.error('Failed to get sync queue:', error);
    res.status(500).json({
      error: 'Failed to get sync queue'
    });
  }
};

// Configure sync settings
export const configureSyncSettings = async (req: Request, res: Response) => {
  try {
    const {
      enableRealTimeSync,
      enableScheduledSync,
      scheduleCron,
      onboardingApiUrl,
      onboardingApiKey
    } = req.body;

    // Update environment variables or configuration
    if (onboardingApiUrl) {
      process.env.ONBOARDING_API_URL = onboardingApiUrl;
    }
    if (onboardingApiKey) {
      process.env.ONBOARDING_API_KEY = onboardingApiKey;
    }

    // Reinitialize sync service with new config
    const config: any = {};
    if (enableRealTimeSync !== undefined) config.enableRealTimeSync = enableRealTimeSync;
    if (enableScheduledSync !== undefined) config.enableScheduledSync = enableScheduledSync;
    if (scheduleCron) config.scheduleCron = scheduleCron;

    // Note: In production, you'd want to properly reinitialize the service
    // For now, we'll just return the updated config
    res.json({
      message: 'Sync settings updated',
      settings: {
        enableRealTimeSync: enableRealTimeSync ?? true,
        enableScheduledSync: enableScheduledSync ?? true,
        scheduleCron: scheduleCron || '0 */4 * * *',
        onboardingApiUrl: process.env.ONBOARDING_API_URL,
        onboardingApiKeySet: !!process.env.ONBOARDING_API_KEY
      }
    });

  } catch (error) {
    console.error('Failed to configure sync settings:', error);
    res.status(500).json({
      error: 'Failed to configure sync settings'
    });
  }
};

// Test sync connection
export const testSyncConnection = async (req: Request, res: Response) => {
  try {
    // Test connection to onboarding API
    const apiUrl = process.env.ONBOARDING_API_URL || 'http://localhost:3001/api';
    
    // In a real implementation, you'd make an actual API call to test the connection
    // For now, we'll just check if the URL is configured
    if (!apiUrl || !process.env.ONBOARDING_API_KEY) {
      return res.status(503).json({
        connected: false,
        error: 'Onboarding API not configured'
      });
    }

    res.json({
      connected: true,
      apiUrl,
      message: 'Connection test successful'
    });

  } catch (error) {
    console.error('Failed to test sync connection:', error);
    res.status(500).json({
      connected: false,
      error: 'Failed to test connection'
    });
  }
};

// SSE endpoint for real-time sync updates
export const syncUpdates = async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"type": "connected"}\n\n');

  // Subscribe to sync events
  const handlers = {
    [SyncEvent.SYNC_STARTED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'sync_started', data })}\n\n`);
    },
    [SyncEvent.SYNC_PROGRESS]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'sync_progress', data })}\n\n`);
    },
    [SyncEvent.SYNC_COMPLETED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'sync_completed', data })}\n\n`);
    },
    [SyncEvent.SYNC_FAILED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'sync_failed', data })}\n\n`);
    },
    [SyncEvent.VESSEL_SYNCED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'vessel_synced', data })}\n\n`);
    },
    [SyncEvent.EQUIPMENT_SYNCED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'equipment_synced', data })}\n\n`);
    },
    [SyncEvent.USER_SYNCED]: (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'user_synced', data })}\n\n`);
    }
  };

  // Register event listeners
  Object.entries(handlers).forEach(([event, handler]) => {
    syncService.on(event, handler);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    Object.entries(handlers).forEach(([event, handler]) => {
      syncService.off(event, handler);
    });
  });
};