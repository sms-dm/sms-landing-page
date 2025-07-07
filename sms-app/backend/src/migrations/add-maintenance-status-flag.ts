import { dbRun } from '../config/database.abstraction';

export async function up() {
  console.log('Adding maintenance status completion flag to users table...');
  
  try {
    // Add maintenance_status_complete flag to users table
    await dbRun(`
      ALTER TABLE users 
      ADD COLUMN maintenance_status_complete BOOLEAN DEFAULT FALSE
    `);
    
    // Add first_login flag to track if this is user's first login after sync
    await dbRun(`
      ALTER TABLE users 
      ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE
    `);
    
    // Add maintenance status completion timestamp
    await dbRun(`
      ALTER TABLE users 
      ADD COLUMN maintenance_status_completed_at TIMESTAMPTZ
    `);
    
    console.log('Successfully added maintenance status flags');
    
  } catch (error) {
    console.error('Failed to add maintenance status flags:', error);
    throw error;
  }
}

export async function down() {
  console.log('Removing maintenance status flags from users table...');
  
  try {
    await dbRun(`ALTER TABLE users DROP COLUMN maintenance_status_complete`);
    await dbRun(`ALTER TABLE users DROP COLUMN is_first_login`);
    await dbRun(`ALTER TABLE users DROP COLUMN maintenance_status_completed_at`);
    
    console.log('Successfully removed maintenance status flags');
  } catch (error) {
    console.error('Failed to remove maintenance status flags:', error);
    throw error;
  }
}