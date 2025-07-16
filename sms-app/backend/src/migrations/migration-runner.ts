import { databaseConfig } from '../config/database.config';
import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  id: number;
  name: string;
  filename: string;
  appliedAt?: Date;
}

class MigrationRunner {
  private dbType: 'sqlite' | 'postgresql';
  private pgPool?: Pool;
  private sqliteDb?: sqlite3.Database;
  private sqliteRun?: Function;
  private sqliteGet?: Function;
  private sqliteAll?: Function;
  
  constructor() {
    this.dbType = databaseConfig.type;
    
    if (this.dbType === 'postgresql' && databaseConfig.postgresql) {
      this.pgPool = new Pool({
        connectionString: databaseConfig.postgresql.connectionString ||
          `postgresql://${databaseConfig.postgresql.user}:${databaseConfig.postgresql.password}@${databaseConfig.postgresql.host}:${databaseConfig.postgresql.port}/${databaseConfig.postgresql.database}`,
        ssl: databaseConfig.postgresql.ssl
      });
    } else if (databaseConfig.sqlite) {
      this.sqliteDb = new sqlite3.Database(databaseConfig.sqlite.filename);
      this.sqliteRun = promisify(this.sqliteDb.run.bind(this.sqliteDb));
      this.sqliteGet = promisify(this.sqliteDb.get.bind(this.sqliteDb));
      this.sqliteAll = promisify(this.sqliteDb.all.bind(this.sqliteDb));
    }
  }
  
  async createMigrationsTable(): Promise<void> {
    const sql = this.dbType === 'postgresql' 
      ? `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          filename VARCHAR(255) NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `
      : `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          filename TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
    
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.sqliteRun) {
      await this.sqliteRun(sql);
    }
    
    console.log('✅ Migrations table ready');
  }
  
  async getAppliedMigrations(): Promise<Migration[]> {
    const sql = 'SELECT * FROM migrations ORDER BY id';
    
    if (this.dbType === 'postgresql' && this.pgPool) {
      const result = await this.pgPool.query(sql);
      return result.rows;
    } else if (this.sqliteAll) {
      return await this.sqliteAll(sql) as Migration[];
    }
    
    return [];
  }
  
  async recordMigration(name: string, filename: string): Promise<void> {
    const sql = this.dbType === 'postgresql'
      ? 'INSERT INTO migrations (name, filename) VALUES ($1, $2)'
      : 'INSERT INTO migrations (name, filename) VALUES (?, ?)';
    
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(sql, [name, filename]);
    } else if (this.sqliteRun) {
      await this.sqliteRun(sql, [name, filename]);
    }
  }
  
  async runSQLFile(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    
    if (this.dbType === 'postgresql' && this.pgPool) {
      // Split by semicolons but be careful with functions
      const statements = content
        .split(/;\s*$|;\s*\n/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');
      
      for (const statement of statements) {
        if (statement.trim() && !statement.trim().startsWith('--')) {
          try {
            await this.pgPool.query(statement);
          } catch (err: any) {
            // Ignore "already exists" errors for compatibility
            if (!err.message.includes('already exists')) {
              console.error(`Error executing statement: ${err.message}`);
              throw err;
            }
          }
        }
      }
    } else if (this.sqliteDb) {
      // SQLite can execute multiple statements at once
      await new Promise((resolve, reject) => {
        this.sqliteDb!.exec(content, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    }
  }
  
  async runTypeScriptMigration(filepath: string): Promise<void> {
    const migration = await import(filepath);
    if (typeof migration.up === 'function') {
      await migration.up(this.dbType === 'postgresql' ? this.pgPool : this.sqliteDb);
    } else if (typeof migration.default === 'function') {
      await migration.default(this.dbType === 'postgresql' ? this.pgPool : this.sqliteDb);
    } else {
      throw new Error(`Migration ${filepath} does not export an 'up' function or default function`);
    }
  }
  
  async getMigrationFiles(): Promise<{ name: string; filename: string; filepath: string }[]> {
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    
    const migrations = files
      .filter(f => (f.endsWith('.sql') || f.endsWith('.ts')) && !f.includes('migration-runner'))
      .sort()
      .map(filename => {
        const name = filename.replace(/\.(sql|ts)$/, '');
        const filepath = path.join(migrationsDir, filename);
        return { name, filename, filepath };
      });
    
    return migrations;
  }
  
  async run(): Promise<void> {
    try {
      console.log(`🚀 Running migrations for ${this.dbType}...`);
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedNames = new Set(appliedMigrations.map(m => m.name));
      
      // Get migration files
      const migrationFiles = await this.getMigrationFiles();
      
      // Run pending migrations
      let ranCount = 0;
      for (const migration of migrationFiles) {
        if (!appliedNames.has(migration.name)) {
          console.log(`📝 Running migration: ${migration.name}`);
          
          try {
            if (migration.filename.endsWith('.sql')) {
              await this.runSQLFile(migration.filepath);
            } else if (migration.filename.endsWith('.ts')) {
              await this.runTypeScriptMigration(migration.filepath);
            }
            
            await this.recordMigration(migration.name, migration.filename);
            console.log(`✅ Completed: ${migration.name}`);
            ranCount++;
          } catch (error: any) {
            console.error(`❌ Failed migration ${migration.name}:`, error.message);
            throw error;
          }
        }
      }
      
      if (ranCount === 0) {
        console.log('✅ All migrations are up to date');
      } else {
        console.log(`✅ Successfully ran ${ranCount} migration(s)`);
      }
      
    } finally {
      // Clean up connections
      if (this.pgPool) {
        await this.pgPool.end();
      }
      if (this.sqliteDb) {
        this.sqliteDb.close();
      }
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default MigrationRunner;