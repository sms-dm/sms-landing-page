import { dbRun, initializeDatabase } from '../config/database';

export async function up() {
  console.log('Fixing activation_codes table structure...');

  // Add missing columns to activation_codes table
  const columnsToAdd = [
    { name: 'activated_at', type: 'DATETIME' },
    { name: 'reminder_sent_at', type: 'DATETIME' },
    { name: 'expired_notification_sent', type: 'INTEGER DEFAULT 0' },
    { name: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];

  for (const column of columnsToAdd) {
    try {
      await dbRun(`
        ALTER TABLE activation_codes 
        ADD COLUMN ${column.name} ${column.type}
      `);
      console.log(`✅ Added column ${column.name}`);
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        console.log(`ℹ️  Column ${column.name} already exists`);
      } else {
        console.error(`❌ Error adding column ${column.name}:`, error.message);
      }
    }
  }

  // Create activation_codes table if it doesn't exist with all columns
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      activated_at DATETIME,
      reminder_sent_at DATETIME,
      expired_notification_sent INTEGER DEFAULT 0,
      regenerated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Create index
  await dbRun(`
    CREATE INDEX IF NOT EXISTS idx_activation_codes_code 
    ON activation_codes(code)
  `).catch(() => console.log('Index already exists'));

  await dbRun(`
    CREATE INDEX IF NOT EXISTS idx_activation_codes_company 
    ON activation_codes(company_id)
  `).catch(() => console.log('Index already exists'));

  console.log('✅ Activation codes table structure fixed');
}

export async function down() {
  // Nothing to do - we don't want to drop columns
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