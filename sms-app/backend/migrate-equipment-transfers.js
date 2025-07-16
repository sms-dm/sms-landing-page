const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'sms.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Creating equipment_transfers table...');

// Create the table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_transfers (
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
  `, (err) => {
    if (err) {
      console.error('❌ Failed to create table:', err);
      process.exit(1);
    }
    console.log('✅ equipment_transfers table created successfully');
  });

  // Create indexes
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_equipment_transfers_equipment 
    ON equipment_transfers(equipment_id)
  `, (err) => {
    if (err) console.error('Index creation error:', err);
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_equipment_transfers_vessels 
    ON equipment_transfers(from_vessel_id, to_vessel_id)
  `, (err) => {
    if (err) console.error('Index creation error:', err);
    console.log('✅ Indexes created successfully');
    console.log('🎉 Equipment transfers migration completed successfully');
    db.close();
  });
});