import { dbRun, dbGet } from '../config/database';

export const addEmailQueue = async () => {
  try {
    // Check if table already exists
    const tableExists = await dbGet(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='email_queue'"
    );

    if (tableExists) {
      console.log('ℹ️  Email queue table already exists');
      return;
    }

    console.log('📧 Creating email queue table...');

    // Create email_queue table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_name TEXT NOT NULL,
        template_data JSON NOT NULL,
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        failed_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for efficient queue processing
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled 
      ON email_queue(status, scheduled_at)
      WHERE status IN ('pending', 'failed')
    `);

    // Create email_logs table for tracking sent emails
    await dbRun(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue_id INTEGER,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'complained')),
        message_id TEXT,
        sent_at DATETIME,
        opened_at DATETIME,
        clicked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (queue_id) REFERENCES email_queue(id)
      )
    `);

    // Create activation_codes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activation_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        activated_at DATETIME,
        reminder_sent_at DATETIME,
        expired_notification_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);

    // Create index for activation code lookups
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_activation_codes_code 
      ON activation_codes(code)
    `);

    // Create index for expiry checks
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_activation_codes_expires 
      ON activation_codes(expires_at, reminder_sent_at, expired_notification_sent)
      WHERE activated_at IS NULL
    `);

    console.log('✅ Email queue tables created successfully');

  } catch (error) {
    console.error('❌ Error creating email queue tables:', error);
    throw error;
  }
};