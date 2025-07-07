import { dbRun } from '../config/database.abstraction';

export const up = async () => {
  console.log('🔄 Running migration: Adding last_seen field to users table...');

  try {
    // Add last_seen column to users table
    await dbRun(`
      ALTER TABLE users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `).catch(() => console.log('last_seen column already exists'));

    console.log('✅ Last seen migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

export const down = async () => {
  console.log('🔄 Rolling back: Removing last_seen field from users table...');
  
  try {
    await dbRun(`
      ALTER TABLE users DROP COLUMN IF EXISTS last_seen
    `);
    
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback error:', error);
    throw error;
  }
};

// Run the migration
if (require.main === module) {
  up().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}