import { dbRun, dbAll } from '../config/database.abstraction';

async function addNotificationPreferences() {
  console.log('🔄 Adding notification preferences and manager relationships...');
  
  try {
    // Check if columns already exist
    const tableInfo = await dbAll("PRAGMA table_info(users)");
    const hasManagerId = tableInfo.some((col: any) => col.name === 'manager_id');
    const hasNotifyPrefs = tableInfo.some((col: any) => col.name === 'notify_critical_faults');
    
    // Add manager_id if it doesn't exist
    if (!hasManagerId) {
      console.log('📊 Adding manager_id column...');
      await dbRun(`
        ALTER TABLE users 
        ADD COLUMN manager_id INTEGER REFERENCES users(id)
      `);
    }
    
    // Add notification preferences if they don't exist
    if (!hasNotifyPrefs) {
      console.log('📊 Adding notification preference columns...');
      
      await dbRun(`
        ALTER TABLE users 
        ADD COLUMN notify_critical_faults BOOLEAN DEFAULT 1
      `);
      
      await dbRun(`
        ALTER TABLE users 
        ADD COLUMN notify_maintenance_reminders BOOLEAN DEFAULT 1
      `);
      
      await dbRun(`
        ALTER TABLE users 
        ADD COLUMN notify_fault_resolutions BOOLEAN DEFAULT 1
      `);
    }
    
    // Update demo data with manager relationships
    console.log('🔧 Updating demo user manager relationships...');
    
    // John Doe reports to Tom Rodriguez (Electrical Manager)
    await dbRun(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE email = 'tom.rodriguez@oceanic.com')
      WHERE email = 'john.doe@oceanic.com'
    `);
    
    // Mike Chen reports to James Wilson (Mechanical Manager)
    await dbRun(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE email = 'james.wilson@oceanic.com')
      WHERE email = 'mike.chen@oceanic.com'
    `);
    
    // Sarah Williams reports to Lisa Anderson (HSE Manager)
    await dbRun(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE email = 'lisa.anderson@oceanic.com')
      WHERE email = 'sarah.williams@oceanic.com'
    `);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addNotificationPreferences()
  .then(() => {
    console.log('🎉 Notification preferences migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });