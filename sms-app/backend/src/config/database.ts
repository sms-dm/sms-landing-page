import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { addUserPreferences } from '../migrations/add-user-preferences';
import { addEmailQueue } from '../migrations/add-email-queue';
import { addCompanyContact } from '../migrations/add-company-contact';

const sqlite = sqlite3.verbose();

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'sms.db');

// Create database connection
export const db = new sqlite.Database(DB_PATH);

// Promisify database methods for async/await
// Note: SQLite's promisified methods have overloads for different parameter styles
export const dbRun = promisify(db.run.bind(db)) as ((sql: string) => Promise<any>) & ((sql: string, params: any[]) => Promise<any>);
export const dbGet = promisify(db.get.bind(db)) as ((sql: string) => Promise<any>) & ((sql: string, params: any[]) => Promise<any>);
export const dbAll = promisify(db.all.bind(db)) as ((sql: string) => Promise<any[]>) & ((sql: string, params: any[]) => Promise<any[]>);

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    // Create companies table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#0066CC',
        secondary_color TEXT DEFAULT '#E6F2FF',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vessels table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS vessels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        imo_number TEXT UNIQUE,
        vessel_type TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'operational',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);

    // Create users table with notification preferences
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('technician', 'manager', 'admin')),
        manager_id INTEGER, -- Direct manager for technicians
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        -- Notification preferences
        notify_critical_faults BOOLEAN DEFAULT 1,
        notify_maintenance_reminders BOOLEAN DEFAULT 1,
        notify_fault_resolutions BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES users(id)
      )
    `);

    // Create equipment table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vessel_id INTEGER NOT NULL,
        qr_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        serial_number TEXT,
        location TEXT NOT NULL,
        equipment_type TEXT NOT NULL,
        status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'fault', 'decommissioned')),
        criticality TEXT DEFAULT 'STANDARD' CHECK (criticality IN ('CRITICAL', 'IMPORTANT', 'STANDARD')),
        classification TEXT DEFAULT 'PERMANENT' CHECK (classification IN ('PERMANENT', 'TEMPORARY', 'RENTAL')),
        installation_date DATE,
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        specifications JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE
      )
    `);

    // Create equipment_documents table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS equipment_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        document_type TEXT NOT NULL CHECK (document_type IN ('manual', 'schematic', 'certificate', 'report', 'other')),
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        uploaded_by INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Create faults table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS faults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        reported_by INTEGER NOT NULL,
        fault_type TEXT NOT NULL CHECK (fault_type IN ('critical', 'minor')),
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        description TEXT NOT NULL,
        root_cause TEXT,
        resolution TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        downtime_minutes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_by) REFERENCES users(id)
      )
    `);

    // Create parts_used table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS parts_used (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fault_id INTEGER NOT NULL,
        part_number TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_cost DECIMAL(10,2),
        markup_percentage DECIMAL(5,2) DEFAULT 20.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
      )
    `);

    // Create maintenance_logs table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        performed_by INTEGER NOT NULL,
        maintenance_type TEXT NOT NULL,
        description TEXT,
        parts_replaced JSON,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        next_due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (performed_by) REFERENCES users(id)
      )
    `);

    // Create search_index table for drawing search
    await dbRun(`
      CREATE TABLE IF NOT EXISTS search_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        page_number INTEGER,
        content TEXT NOT NULL,
        highlights JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES equipment_documents(id) ON DELETE CASCADE
      )
    `);

    // Create virtual table for full-text search
    await dbRun(`
      CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
        content, 
        document_id UNINDEXED,
        page_number UNINDEXED,
        tokenize = 'porter'
      )
    `);

    console.log('✅ Database schema created successfully');

    // Run migrations
    await addUserPreferences();
    await addEmailQueue();
    await addCompanyContact();

    // Insert demo data
    await insertDemoData();

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Insert demo data for testing
const insertDemoData = async () => {
  try {
    // Check if demo data already exists
    const companyExists = await dbGet('SELECT id FROM companies WHERE slug = ?', ['oceanic']);
    if (companyExists) {
      console.log('ℹ️ Demo data already exists, skipping...');
      return;
    }

    console.log('📦 Inserting demo data...');

    // Insert demo company - Oceanic Marine Services (generic for demos)
    await dbRun(`
      INSERT INTO companies (name, slug, logo_url, primary_color, secondary_color)
      VALUES (?, ?, ?, ?, ?)
    `, ['Oceanic Marine Services', 'oceanic', '/assets/logos/oceanic-logo.svg', '#0066CC', '#E6F2FF']);

    const company = await dbGet('SELECT id FROM companies WHERE slug = ?', ['oceanic']);
    const companyId = company.id;

    // Also add Geoquip for backwards compatibility
    await dbRun(`
      INSERT INTO companies (name, slug, logo_url, primary_color, secondary_color)
      VALUES (?, ?, ?, ?, ?)
    `, ['Geoquip Marine', 'geoquip', '/assets/logos/geoquip-logo.svg', '#003366', '#E6F2FF']);

    // Insert demo vessels with generic names
    const vesselData = [
      ['MV Pacific Explorer', 'IMO9876543', 'Multi-Purpose Support Vessel', '/assets/vessels/vessel1.svg'],
      ['MV Atlantic Guardian', 'IMO9876544', 'Offshore Construction Vessel', '/assets/vessels/vessel2.svg'],
      ['MV Northern Pioneer', 'IMO9876545', 'Platform Supply Vessel', '/assets/vessels/vessel3.svg']
    ];

    for (const [name, imo, type, image] of vesselData) {
      await dbRun(`
        INSERT INTO vessels (company_id, name, imo_number, vessel_type, image_url)
        VALUES (?, ?, ?, ?, ?)
      `, [companyId, name, imo, type, image]);
    }

    // Get first vessel ID for equipment
    const vessel = await dbGet('SELECT id FROM vessels WHERE company_id = ? LIMIT 1', [companyId]);
    const vesselId = vessel.id;
    
    // Also create vessels for Geoquip
    const geoquipCompany = await dbGet('SELECT id FROM companies WHERE slug = ?', ['geoquip']);
    if (geoquipCompany) {
      for (const [name, imo, type, image] of vesselData) {
        await dbRun(`
          INSERT INTO vessels (company_id, name, imo_number, vessel_type, image_url)
          VALUES (?, ?, ?, ?, ?)
        `, [geoquipCompany.id, name.replace('MV', 'Geoquip'), imo + '1', type, image]);
      }
    }

    // Insert demo users with manager relationships
    const users = [
      ['demo.tech@oceanic.com', 'Alex', 'Thompson', 'technician', '/assets/avatars/tech1.svg', null],
      ['demo.manager@oceanic.com', 'Sarah', 'Mitchell', 'manager', '/assets/avatars/manager1.svg', null],
      ['demo.admin@oceanic.com', 'System', 'Admin', 'admin', null, null],
      ['john.doe@oceanic.com', 'John', 'Doe', 'technician', '/assets/avatars/tech2.svg', 'tom.rodriguez@oceanic.com'], // Reports to Tom
      ['mike.chen@oceanic.com', 'Mike', 'Chen', 'technician', '/assets/avatars/tech3.svg', 'james.wilson@oceanic.com'], // Reports to James
      ['sarah.williams@oceanic.com', 'Sarah', 'Williams', 'technician', '/assets/avatars/tech4.svg', 'lisa.anderson@oceanic.com'], // Reports to Lisa
      ['tom.rodriguez@oceanic.com', 'Tom', 'Rodriguez', 'manager', '/assets/avatars/manager2.svg', null], // Electrical Manager
      ['james.wilson@oceanic.com', 'James', 'Wilson', 'manager', '/assets/avatars/manager3.svg', null], // Mechanical Manager
      ['lisa.anderson@oceanic.com', 'Lisa', 'Anderson', 'manager', '/assets/avatars/manager4.svg', null], // HSE Manager
      ['admin@smsportal.com', 'SMS Portal', 'Admin', 'admin', null, null] // SMS Portal Admin
    ];

    // Insert SMS Portal company for the admin user
    await dbRun(`
      INSERT INTO companies (name, slug, logo_url, primary_color, secondary_color)
      VALUES (?, ?, ?, ?, ?)
    `, ['SMS Portal', 'sms-portal', '/assets/logos/sms-logo.svg', '#00CED1', '#F0FFFF']);
    
    const smsPortalCompany = await dbGet('SELECT id FROM companies WHERE slug = ?', ['sms-portal']);

    // First pass - insert managers
    for (const [email, firstName, lastName, role, avatar, managerEmail] of users) {
      if (role === 'manager' || role === 'admin') {
        const passwordHash = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36';
        const userCompanyId = email === 'admin@smsportal.com' ? smsPortalCompany.id : companyId;
        
        await dbRun(`
          INSERT INTO users (company_id, email, password_hash, first_name, last_name, role, avatar_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userCompanyId, email, passwordHash, firstName, lastName, role, avatar]);
      }
    }

    // Second pass - insert technicians with manager relationships
    for (const [email, firstName, lastName, role, avatar, managerEmail] of users) {
      if (role === 'technician') {
        const passwordHash = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36';
        
        // Find manager ID
        let managerId = null;
        if (managerEmail) {
          const manager = await dbGet('SELECT id FROM users WHERE email = ?', [managerEmail]);
          managerId = manager?.id;
        }
        
        await dbRun(`
          INSERT INTO users (company_id, email, password_hash, first_name, last_name, role, avatar_url, manager_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [companyId, email, passwordHash, firstName, lastName, role, avatar, managerId]);
      }
    }

    // Insert demo equipment
    const equipmentData = [
      ['SMS-001', 'Main Engine 1', 'MAN B&W', 'M750', 'SN123456', 'Engine Room', 'engine', '7500kW, 750rpm'],
      ['SMS-002', 'Main Engine 2', 'MAN B&W', 'M750', 'SN123457', 'Engine Room', 'engine', '7500kW, 750rpm'],
      ['SMS-003', 'Bow Thruster', 'Rolls-Royce', 'TT2000', 'SN789012', 'Bow Thruster Room', 'thruster', '2000kW, Azimuth'],
      ['SMS-004', 'Emergency Generator', 'Caterpillar', 'C32', 'SN345678', 'Emergency Gen Room', 'generator', '1000kW, 1500rpm'],
      ['SMS-005', 'Main Crane', 'Liebherr', 'RL-K7500', 'SN901234', 'Main Deck', 'crane', '250T capacity'],
      ['SMS-006', 'HPU System', 'Bosch Rexroth', 'HPU-450', 'SN567890', 'HPU Room', 'hydraulic', '450bar, 2x250kW']
    ];

    for (const [qrCode, name, manufacturer, model, serial, location, type, specs] of equipmentData) {
      await dbRun(`
        INSERT INTO equipment (
          vessel_id, qr_code, name, manufacturer, model, 
          serial_number, location, equipment_type, specifications
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [vesselId, qrCode, name, manufacturer, model, serial, location, type, JSON.stringify({ description: specs })]);
    }

    console.log('✅ Demo data inserted successfully');

  } catch (error) {
    console.error('❌ Error inserting demo data:', error);
  }
};