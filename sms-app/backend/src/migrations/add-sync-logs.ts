import { dbRun } from '../config/database.abstraction';

export async function up() {
  console.log('Creating sync_logs table...');
  
  // Create sync_logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id VARCHAR(36) PRIMARY KEY,
      type VARCHAR(20) NOT NULL CHECK (type IN ('manual', 'scheduled', 'webhook', 'real_time')),
      direction VARCHAR(50) NOT NULL CHECK (direction IN ('onboarding_to_maintenance', 'maintenance_to_onboarding')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      vessels_synced INTEGER DEFAULT 0,
      equipment_synced INTEGER DEFAULT 0,
      users_synced INTEGER DEFAULT 0,
      parts_synced INTEGER DEFAULT 0,
      documents_synced INTEGER DEFAULT 0,
      errors TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes (wrapped in try-catch for idempotency)
  try {
    await dbRun('CREATE INDEX idx_sync_logs_status ON sync_logs(status)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_sync_logs_type ON sync_logs(type)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  // Create sync_queue table for tracking individual sync items
  await dbRun(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id SERIAL PRIMARY KEY,
      sync_log_id VARCHAR(36) REFERENCES sync_logs(id) ON DELETE CASCADE,
      entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('company', 'vessel', 'equipment', 'user', 'part', 'document')),
      entity_id VARCHAR(255) NOT NULL,
      operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMPTZ
    )
  `);

  // Create indexes for sync_queue
  try {
    await dbRun('CREATE INDEX idx_sync_queue_sync_log ON sync_queue(sync_log_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_sync_queue_status ON sync_queue(status)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  // Create webhook_events table for tracking incoming webhooks
  await dbRun(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id SERIAL PRIMARY KEY,
      event_id VARCHAR(255) UNIQUE NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('received', 'processing', 'processed', 'failed')),
      error_message TEXT,
      received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMPTZ
    )
  `);

  // Create indexes for webhook_events
  try {
    await dbRun('CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_webhook_events_type ON webhook_events(event_type)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  
  try {
    await dbRun('CREATE INDEX idx_webhook_events_status ON webhook_events(status)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  console.log('Sync tables created successfully');
}

export async function down() {
  console.log('Dropping sync tables...');
  
  await dbRun('DROP TABLE IF EXISTS webhook_events');
  await dbRun('DROP TABLE IF EXISTS sync_queue');
  await dbRun('DROP TABLE IF EXISTS sync_logs');
  
  console.log('Sync tables dropped successfully');
}