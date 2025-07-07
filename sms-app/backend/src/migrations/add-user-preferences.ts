import { dbRun, dbGet } from '../config/database.abstraction';

export const addUserPreferences = async () => {
  console.log('🔄 Running migration: Adding user preferences...');

  try {
    // Add display preferences
    await dbRun(`
      ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark' 
      CHECK (theme IN ('dark', 'light'))
    `).catch(() => console.log('theme column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN date_format TEXT DEFAULT 'MM/DD/YYYY' 
      CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'))
    `).catch(() => console.log('date_format column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN time_format TEXT DEFAULT '12h' 
      CHECK (time_format IN ('12h', '24h'))
    `).catch(() => console.log('time_format column already exists'));

    // Add work preferences
    await dbRun(`
      ALTER TABLE users ADD COLUMN default_vessel_id INTEGER
      REFERENCES vessels(id)
    `).catch(() => console.log('default_vessel_id column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN equipment_view TEXT DEFAULT 'grid' 
      CHECK (equipment_view IN ('grid', 'list', 'map'))
    `).catch(() => console.log('equipment_view column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN equipment_sort TEXT DEFAULT 'name' 
      CHECK (equipment_sort IN ('name', 'location', 'criticality', 'last_maintained'))
    `).catch(() => console.log('equipment_sort column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN show_decommissioned BOOLEAN DEFAULT 0
    `).catch(() => console.log('show_decommissioned column already exists'));

    // Add communication preferences
    await dbRun(`
      ALTER TABLE users ADD COLUMN notification_sound BOOLEAN DEFAULT 1
    `).catch(() => console.log('notification_sound column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN desktop_notifications BOOLEAN DEFAULT 1
    `).catch(() => console.log('desktop_notifications column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN sms_notifications BOOLEAN DEFAULT 0
    `).catch(() => console.log('sms_notifications column already exists'));

    await dbRun(`
      ALTER TABLE users ADD COLUMN phone_number TEXT
    `).catch(() => console.log('phone_number column already exists'));

    console.log('✅ User preferences migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run the migration
if (require.main === module) {
  addUserPreferences().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}