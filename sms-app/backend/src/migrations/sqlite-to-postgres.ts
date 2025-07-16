import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { promisify } from 'util';
import path from 'path';

dotenv.config();

// SQLite connection
const sqliteDb = new sqlite3.Database(path.join(process.cwd(), 'data', 'sms.db'));
const sqliteGet = promisify(sqliteDb.get.bind(sqliteDb));
const sqliteAll = promisify(sqliteDb.all.bind(sqliteDb));

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sms_user:sms_pass@localhost:5432/sms_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface TableMapping {
  source: string;
  target: string;
  columns: { [key: string]: string };
  transform?: (row: any) => any;
}

// Define table mappings
const tableMappings: TableMapping[] = [
  {
    source: 'companies',
    target: 'companies',
    columns: {
      id: 'id',
      name: 'name',
      subscription_type: 'subscription_type',
      subscription_start: 'subscription_start',
      subscription_end: 'subscription_end',
      max_vessels: 'max_vessels',
      max_users: 'max_users',
      is_active: 'is_active',
      created_at: 'created_at',
      updated_at: 'updated_at',
      contact_email: 'contact_email',
      contact_phone: 'contact_phone',
      address: 'address',
      logo_url: 'logo_url'
    },
    transform: (row) => ({
      ...row,
      is_active: row.is_active === 1,
      subscription_start: row.subscription_start ? new Date(row.subscription_start) : new Date(),
      subscription_end: row.subscription_end ? new Date(row.subscription_end) : null,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date()
    })
  },
  {
    source: 'vessels',
    target: 'vessels',
    columns: {
      id: 'id',
      company_id: 'company_id',
      name: 'name',
      imo_number: 'imo_number',
      flag: 'flag',
      vessel_type: 'vessel_type',
      build_year: 'build_year',
      gross_tonnage: 'gross_tonnage',
      is_active: 'is_active',
      created_at: 'created_at',
      updated_at: 'updated_at'
    },
    transform: (row) => ({
      ...row,
      is_active: row.is_active === 1,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date()
    })
  },
  {
    source: 'users',
    target: 'users',
    columns: {
      id: 'id',
      company_id: 'company_id',
      username: 'username',
      email: 'email',
      password_hash: 'password_hash',
      role: 'role',
      first_name: 'first_name',
      last_name: 'last_name',
      is_active: 'is_active',
      created_at: 'created_at',
      last_login: 'last_login',
      refresh_token: 'refresh_token',
      phone_number: 'phone_number',
      job_title: 'job_title',
      department: 'department',
      employee_id: 'employee_id',
      date_of_joining: 'date_of_joining',
      profile_picture: 'profile_picture',
      signature: 'signature',
      manager_id: 'manager_id',
      notify_critical_faults: 'notify_critical_faults',
      notify_maintenance_reminders: 'notify_maintenance_reminders',
      notify_fault_resolutions: 'notify_fault_resolutions',
      theme: 'theme',
      date_format: 'date_format',
      time_format: 'time_format',
      default_vessel_id: 'default_vessel_id',
      equipment_view: 'equipment_view',
      equipment_sort: 'equipment_sort',
      show_decommissioned: 'show_decommissioned',
      notification_sound: 'notification_sound',
      desktop_notifications: 'desktop_notifications',
      sms_notifications: 'sms_notifications'
    },
    transform: (row) => ({
      ...row,
      is_active: row.is_active === 1,
      notify_critical_faults: row.notify_critical_faults !== 0,
      notify_maintenance_reminders: row.notify_maintenance_reminders !== 0,
      notify_fault_resolutions: row.notify_fault_resolutions !== 0,
      show_decommissioned: row.show_decommissioned === 1,
      notification_sound: row.notification_sound !== 0,
      desktop_notifications: row.desktop_notifications === 1,
      sms_notifications: row.sms_notifications === 1,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      last_login: row.last_login ? new Date(row.last_login) : null,
      date_of_joining: row.date_of_joining ? new Date(row.date_of_joining) : null
    })
  },
  {
    source: 'equipment',
    target: 'equipment',
    columns: {
      id: 'id',
      vessel_id: 'vessel_id',
      name: 'name',
      description: 'description',
      manufacturer: 'manufacturer',
      model: 'model',
      serial_number: 'serial_number',
      location: 'location',
      classification: 'classification',
      subsystem: 'subsystem',
      status: 'status',
      qr_code: 'qr_code',
      installation_date: 'installation_date',
      last_maintenance_date: 'last_maintenance_date',
      next_maintenance_date: 'next_maintenance_date',
      maintenance_interval_days: 'maintenance_interval_days',
      criticality: 'criticality',
      running_hours: 'running_hours',
      maintenance_cost: 'maintenance_cost',
      notes: 'notes',
      created_at: 'created_at',
      updated_at: 'updated_at',
      created_by: 'created_by'
    },
    transform: (row) => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      installation_date: row.installation_date ? new Date(row.installation_date) : null,
      last_maintenance_date: row.last_maintenance_date ? new Date(row.last_maintenance_date) : null,
      next_maintenance_date: row.next_maintenance_date ? new Date(row.next_maintenance_date) : null
    })
  },
  {
    source: 'faults',
    target: 'faults',
    columns: {
      id: 'id',
      equipment_id: 'equipment_id',
      reported_by: 'reported_by',
      assigned_to: 'assigned_to',
      title: 'title',
      description: 'description',
      severity: 'severity',
      status: 'status',
      reported_date: 'reported_date',
      resolved_date: 'resolved_date',
      resolution_notes: 'resolution_notes',
      estimated_hours: 'estimated_hours',
      actual_hours: 'actual_hours',
      created_at: 'created_at',
      updated_at: 'updated_at'
    },
    transform: (row) => ({
      ...row,
      reported_date: row.reported_date ? new Date(row.reported_date) : new Date(),
      resolved_date: row.resolved_date ? new Date(row.resolved_date) : null,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date()
    })
  },
  {
    source: 'maintenance_logs',
    target: 'maintenance_logs',
    columns: {
      id: 'id',
      equipment_id: 'equipment_id',
      performed_by: 'performed_by',
      maintenance_type: 'maintenance_type',
      description: 'description',
      performed_date: 'performed_date',
      next_maintenance_date: 'next_maintenance_date',
      hours_spent: 'hours_spent',
      notes: 'notes',
      created_at: 'created_at'
    },
    transform: (row) => ({
      ...row,
      performed_date: row.performed_date ? new Date(row.performed_date) : new Date(),
      next_maintenance_date: row.next_maintenance_date ? new Date(row.next_maintenance_date) : null,
      created_at: row.created_at ? new Date(row.created_at) : new Date()
    })
  },
  {
    source: 'parts_used',
    target: 'parts_used',
    columns: {
      id: 'id',
      fault_id: 'fault_id',
      maintenance_id: 'maintenance_id',
      part_name: 'part_name',
      part_number: 'part_number',
      quantity: 'quantity',
      unit_cost: 'unit_cost',
      total_cost: 'total_cost',
      supplier: 'supplier',
      markup_percentage: 'markup_percentage',
      actual_cost: 'actual_cost',
      created_at: 'created_at',
      created_by: 'created_by'
    },
    transform: (row) => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at) : new Date()
    })
  }
];

async function migrateTable(mapping: TableMapping) {
  console.log(`Migrating ${mapping.source} to ${mapping.target}...`);
  
  try {
    // Get all rows from SQLite
    const rows = await sqliteAll(`SELECT * FROM ${mapping.source}`) as any[];
    
    if (rows.length === 0) {
      console.log(`No data in ${mapping.source}`);
      return;
    }
    
    // Prepare column names
    const targetColumns = Object.values(mapping.columns);
    const placeholders = targetColumns.map((_, i) => `$${i + 1}`);
    
    // Reset sequence if needed
    await pgPool.query(`SELECT setval('${mapping.target}_id_seq', (SELECT MAX(id) FROM ${mapping.target}), true)`).catch(() => {});
    
    // Insert each row
    for (const row of rows) {
      // Transform the row if needed
      const transformedRow = mapping.transform ? mapping.transform(row) : row;
      
      // Map values according to column mapping
      const values = Object.keys(mapping.columns).map(sourceCol => {
        return transformedRow[sourceCol];
      });
      
      const query = `
        INSERT INTO ${mapping.target} (${targetColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (id) DO UPDATE SET
        ${targetColumns.slice(1).map(col => `${col} = EXCLUDED.${col}`).join(', ')}
      `;
      
      try {
        await pgPool.query(query, values);
      } catch (error: any) {
        console.error(`Error inserting into ${mapping.target}:`, error.message);
        console.error('Row:', transformedRow);
      }
    }
    
    console.log(`Migrated ${rows.length} rows from ${mapping.source} to ${mapping.target}`);
  } catch (error) {
    console.error(`Error migrating ${mapping.source}:`, error);
    throw error;
  }
}

async function migrate() {
  console.log('Starting SQLite to PostgreSQL migration...');
  
  try {
    // Create schema first
    const fs = require('fs').promises;
    const schemaPath = path.join(__dirname, '001_create_postgresql_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf-8');
    
    // Execute schema creation
    const statements = schemaSQL
      .split(/;\s*$|;\s*\n/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pgPool.query(statement);
        } catch (err: any) {
          if (!err.message.includes('already exists')) {
            console.error('Schema creation error:', err.message);
          }
        }
      }
    }
    
    // Migrate tables in order (respecting foreign keys)
    for (const mapping of tableMappings) {
      await migrateTable(mapping);
    }
    
    // Update sequences
    const sequences = [
      'companies_id_seq',
      'vessels_id_seq',
      'users_id_seq',
      'equipment_id_seq',
      'faults_id_seq',
      'maintenance_logs_id_seq',
      'parts_used_id_seq'
    ];
    
    for (const seq of sequences) {
      const table = seq.replace('_id_seq', '');
      try {
        await pgPool.query(`SELECT setval('${seq}', (SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), false)`);
      } catch (err) {
        console.error(`Error updating sequence ${seq}:`, err);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}