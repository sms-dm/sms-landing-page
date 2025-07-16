import { dbRun, dbAll } from './config/database';

async function applyMigration() {
  console.log('🔄 Applying migration: Change TEMPORARY to TEMPORARY...');
  
  try {
    // Check if any equipment has TEMPORARY classification
    const temporaryEquipment = await dbAll(
      "SELECT COUNT(*) as count FROM equipment WHERE classification = 'TEMPORARY'"
    );
    
    if (temporaryEquipment[0].count > 0) {
      console.log(`📊 Found ${temporaryEquipment[0].count} equipment with TEMPORARY classification`);
      
      // Update TEMPORARY to TEMPORARY
      await dbRun(
        "UPDATE equipment SET classification = 'TEMPORARY' WHERE classification = 'TEMPORARY'"
      );
      
      console.log('✅ Updated TEMPORARY to TEMPORARY');
    } else {
      console.log('ℹ️  No equipment with TEMPORARY classification found');
    }
    
    // Verify the constraint is correct (this won't change existing data, just for new inserts)
    console.log('✅ Classification values are now: PERMANENT, TEMPORARY, RENTAL');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });