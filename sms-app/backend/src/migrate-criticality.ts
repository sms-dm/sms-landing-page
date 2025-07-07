import { dbRun, dbGet, dbAll } from './config/database';

async function runMigration() {
  console.log('🔄 Starting migration to add criticality and classification fields...');
  
  try {
    // Check if columns already exist
    const tableInfo = await dbAll("PRAGMA table_info(equipment)");
    const hasCriticality = tableInfo.some((col: any) => col.name === 'criticality');
    const hasClassification = tableInfo.some((col: any) => col.name === 'classification');
    
    if (hasCriticality && hasClassification) {
      console.log('✅ Columns already exist, skipping migration');
      return;
    }
    
    // Add criticality column if it doesn't exist
    if (!hasCriticality) {
      console.log('📊 Adding criticality column...');
      await dbRun(`
        ALTER TABLE equipment 
        ADD COLUMN criticality TEXT DEFAULT 'STANDARD' 
        CHECK (criticality IN ('CRITICAL', 'IMPORTANT', 'STANDARD'))
      `);
    }
    
    // Add classification column if it doesn't exist
    if (!hasClassification) {
      console.log('📊 Adding classification column...');
      await dbRun(`
        ALTER TABLE equipment 
        ADD COLUMN classification TEXT DEFAULT 'PERMANENT' 
        CHECK (classification IN ('PERMANENT', 'TEMPORARY', 'RENTAL'))
      `);
    }
    
    // Update existing equipment with sensible defaults based on type
    console.log('🔧 Updating equipment criticality based on type...');
    
    // Critical equipment types
    await dbRun(`
      UPDATE equipment 
      SET criticality = 'CRITICAL'
      WHERE equipment_type IN ('engine', 'generator', 'thruster', 'steering')
        AND criticality = 'STANDARD'
    `);
    
    // Important equipment types
    await dbRun(`
      UPDATE equipment 
      SET criticality = 'IMPORTANT'
      WHERE equipment_type IN ('crane', 'hydraulic', 'pump', 'compressor')
        AND criticality = 'STANDARD'
    `);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Database migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });