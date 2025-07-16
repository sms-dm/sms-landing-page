import { dbRun, initializeDatabase } from '../config/database';

export async function up() {
  console.log('Adding activation help tables...');

  // Add regenerated flag to activation_codes if not exists
  await dbRun(`
    ALTER TABLE activation_codes 
    ADD COLUMN regenerated INTEGER DEFAULT 0
  `).catch(() => {
    console.log('Column regenerated already exists or error adding it');
  });

  // Create activation help logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_help_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      ip_address TEXT,
      success INTEGER DEFAULT 0,
      error_message TEXT,
      new_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for faster queries
  await dbRun(`
    CREATE INDEX IF NOT EXISTS idx_activation_help_logs_email 
    ON activation_help_logs(email)
  `);

  await dbRun(`
    CREATE INDEX IF NOT EXISTS idx_activation_help_logs_created 
    ON activation_help_logs(created_at)
  `);

  console.log('✅ Activation help tables added successfully');
}

export async function down() {
  await dbRun('DROP TABLE IF EXISTS activation_help_logs');
  // Note: We don't remove the regenerated column as it might cause data loss
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => up())
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}