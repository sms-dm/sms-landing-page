import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sms_user:sms_pass@localhost:5432/sms_db',
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Test the connection
pool.connect((err, _client, done) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    done();
  }
});

// Helper functions to match the SQLite interface
export const dbRun = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const result = await pool.query(sql, params);
    return {
      lastID: result.rows[0]?.id, // Assuming RETURNING id
      changes: result.rowCount
    };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Transaction support
export const beginTransaction = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
};

export const commitTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('COMMIT');
  client.release();
};

export const rollbackTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('ROLLBACK');
  client.release();
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Read and execute the migration file
    const fs = require('fs').promises;
    const path = require('path');
    
    const migrationPath = path.join(__dirname, '../migrations/001_create_postgresql_schema.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    // Split by semicolons but be careful with functions
    const statements = migrationSQL
      .split(/;\s*$|;\s*\n/m)
      .filter((stmt: string) => stmt.trim().length > 0)
      .map((stmt: string) => stmt.trim() + ';');
    
    console.log('Running PostgreSQL migrations...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (err: any) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists')) {
            console.error('Migration error:', err.message);
            throw err;
          }
        }
      }
    }
    
    console.log('PostgreSQL database initialized successfully');
    
    // Insert demo data if needed
    const companyCount = await dbGet('SELECT COUNT(*) as count FROM companies');
    if (companyCount.count === 0) {
      console.log('Inserting demo data...');
      await insertDemoData();
    }
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database:', error);
    throw error;
  }
};

// Demo data insertion (converted from SQLite)
const insertDemoData = async () => {
  const client = await beginTransaction();
  
  try {
    // Insert SMS Internal company
    const smsResult = await client.query(`
      INSERT INTO companies (name, subscription_type, max_vessels, max_users, contact_email, logo_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['SMS Internal', 'enterprise', 100, 500, 'admin@smartmaintenancesystems.com', '/sms-logo.png']);
    const smsCompanyId = smsResult.rows[0].id;
    
    // Insert demo companies
    const demoResult = await client.query(`
      INSERT INTO companies (name, subscription_type, max_vessels, max_users, contact_email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['Demo Shipping Corp', 'pro', 10, 100, 'demo@shipping.com']);
    const demoCompanyId = demoResult.rows[0].id;
    
    // Insert vessels
    await client.query(`
      INSERT INTO vessels (company_id, name, imo_number, flag, vessel_type)
      VALUES
        ($1, 'MV Pacific Dream', '9123456', 'Singapore', 'Cargo'),
        ($1, 'MV Atlantic Hope', '9234567', 'Panama', 'Tanker'),
        ($2, 'MV Demo Vessel', '9345678', 'Marshall Islands', 'Container')
    `, [demoCompanyId, demoCompanyId]);
    
    // Insert admin users
    const bcrypt = require('bcryptjs');
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // SMS admin
    await client.query(`
      INSERT INTO users (company_id, username, email, password_hash, role, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [smsCompanyId, 'sms_admin', 'admin@smartmaintenancesystems.com', adminHash, 'admin', 'SMS', 'Admin']);
    
    // Demo company users with manager relationships
    const demoUsers = [
      ['admin', 'admin@demo.com', 'admin', 'Admin', 'User', null],
      ['john_tech', 'john@demo.com', 'technician', 'John', 'Smith', null],
      ['mike_tech', 'mike@demo.com', 'technician', 'Mike', 'Johnson', null],
      ['sarah_tech', 'sarah@demo.com', 'technician', 'Sarah', 'Williams', null],
      ['tom_manager', 'tom@demo.com', 'manager', 'Tom', 'Anderson', null],
      ['james_chief', 'james@demo.com', 'chief_engineer', 'James', 'Brown', null],
      ['lisa_hse', 'lisa@demo.com', 'hse_manager', 'Lisa', 'Davis', null]
    ];
    
    for (const [username, email, role, firstName, lastName] of demoUsers) {
      await client.query(`
        INSERT INTO users (company_id, username, email, password_hash, role, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [demoCompanyId, username, email, adminHash, role, firstName, lastName]);
    }
    
    // Update manager relationships
    await client.query(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE username = 'tom_manager' AND company_id = $1)
      WHERE username = 'john_tech' AND company_id = $1
    `, [demoCompanyId]);
    
    await client.query(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE username = 'james_chief' AND company_id = $1)
      WHERE username = 'mike_tech' AND company_id = $1
    `, [demoCompanyId]);
    
    await client.query(`
      UPDATE users 
      SET manager_id = (SELECT id FROM users WHERE username = 'lisa_hse' AND company_id = $1)
      WHERE username = 'sarah_tech' AND company_id = $1
    `, [demoCompanyId]);
    
    await commitTransaction(client);
    console.log('Demo data inserted successfully');
  } catch (error) {
    await rollbackTransaction(client);
    console.error('Failed to insert demo data:', error);
    throw error;
  }
};

// Export the pool for direct access if needed
export { pool };

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('PostgreSQL pool has ended');
  process.exit(0);
});