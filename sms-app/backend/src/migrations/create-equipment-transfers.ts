import { dbRun, dbAll } from '../config/database.abstraction';

async function createEquipmentTransfersTable() {
  console.log('🔄 Creating equipment_transfers table...');
  
  try {
    // Check if table already exists
    const tableExists = await dbAll(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='equipment_transfers'"
    );
    
    if (tableExists.length > 0) {
      console.log('✅ equipment_transfers table already exists, skipping creation');
      return;
    }
    
    // Create equipment_transfers table
    await dbRun(`
      CREATE TABLE equipment_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        from_vessel_id INTEGER NOT NULL,
        to_vessel_id INTEGER NOT NULL,
        from_location TEXT,
        to_location TEXT,
        transfer_reason TEXT NOT NULL,
        transfer_notes TEXT,
        transferred_by INTEGER NOT NULL,
        transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (from_vessel_id) REFERENCES vessels(id),
        FOREIGN KEY (to_vessel_id) REFERENCES vessels(id),
        FOREIGN KEY (transferred_by) REFERENCES users(id)
      )
    `);
    
    console.log('✅ equipment_transfers table created successfully');
    
    // Create index for faster queries
    await dbRun(`
      CREATE INDEX idx_equipment_transfers_equipment 
      ON equipment_transfers(equipment_id)
    `);
    
    await dbRun(`
      CREATE INDEX idx_equipment_transfers_vessels 
      ON equipment_transfers(from_vessel_id, to_vessel_id)
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
createEquipmentTransfersTable()
  .then(() => {
    console.log('🎉 Equipment transfers migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });