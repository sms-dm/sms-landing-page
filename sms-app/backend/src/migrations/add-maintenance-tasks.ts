import { dbRun } from '../config/database.abstraction';
import fs from 'fs';
import path from 'path';

export async function runMigration() {
  console.log('Running migration: Add maintenance tasks table...');
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '006_add_maintenance_tasks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements (PostgreSQL specific)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + ';');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') || 
          statement.includes('CREATE FUNCTION') || 
          statement.includes('CREATE TRIGGER') ||
          statement.includes('ALTER TABLE')) {
        await dbRun(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    // For SQLite (development), create a simpler version
    const isSQLite = process.env.DB_TYPE === 'sqlite' || !process.env.DATABASE_URL;
    
    if (isSQLite) {
      console.log('Creating SQLite version of maintenance_tasks table...');
      
      await dbRun(`
        CREATE TABLE IF NOT EXISTS maintenance_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
          task_name TEXT NOT NULL,
          description TEXT,
          interval_value INTEGER NOT NULL,
          interval_unit TEXT NOT NULL CHECK (interval_unit IN ('HOURS', 'DAYS', 'MONTHS', 'YEARS')),
          is_active INTEGER DEFAULT 1,
          priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
          estimated_hours REAL,
          required_parts TEXT DEFAULT '[]',
          instructions TEXT,
          safety_notes TEXT,
          metadata TEXT DEFAULT '{}',
          sync_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(equipment_id, task_name)
        )
      `);
      
      // Add the maintenance_tasks_synced column to sync_logs if it doesn't exist
      try {
        await dbRun('ALTER TABLE sync_logs ADD COLUMN maintenance_tasks_synced INTEGER DEFAULT 0');
      } catch (error) {
        // Column might already exist
        console.log('Column maintenance_tasks_synced might already exist');
      }
    }
    
    console.log('Migration completed: Maintenance tasks table created successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}