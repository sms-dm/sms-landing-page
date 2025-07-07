import { databaseConfig } from './database.config';
import * as sqliteModule from './database';
import * as postgresModule from './database.postgres';

// Database abstraction interface
export interface DatabaseInterface {
  dbRun: (sql: string, params?: any[]) => Promise<any>;
  dbGet: (sql: string, params?: any[]) => Promise<any>;
  dbAll: (sql: string, params?: any[]) => Promise<any[]>;
  initializeDatabase: () => Promise<void>;
  beginTransaction?: () => Promise<any>;
  commitTransaction?: (client: any) => Promise<void>;
  rollbackTransaction?: (client: any) => Promise<void>;
}

// Query converter to handle SQLite vs PostgreSQL syntax differences
export class QueryConverter {
  private dbType: 'sqlite' | 'postgresql';
  
  constructor(dbType: 'sqlite' | 'postgresql') {
    this.dbType = dbType;
  }
  
  // Convert SQLite-style placeholders (?) to PostgreSQL-style ($1, $2, etc.)
  convertPlaceholders(sql: string): string {
    if (this.dbType === 'sqlite') return sql;
    
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }
  
  // Convert AUTOINCREMENT to SERIAL
  convertAutoIncrement(sql: string): string {
    if (this.dbType === 'sqlite') return sql;
    
    return sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/AUTOINCREMENT/gi, '');
  }
  
  // Convert SQLite's DATETIME to PostgreSQL's TIMESTAMPTZ
  convertDatetime(sql: string): string {
    if (this.dbType === 'sqlite') return sql;
    
    return sql
      .replace(/DATETIME/gi, 'TIMESTAMPTZ')
      .replace(/CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP');
  }
  
  // Convert boolean values
  convertBoolean(value: any): any {
    if (this.dbType === 'sqlite') {
      return typeof value === 'boolean' ? (value ? 1 : 0) : value;
    }
    return value;
  }
  
  // Convert result boolean values
  convertResultBoolean(value: any): any {
    if (this.dbType === 'sqlite' && (value === 0 || value === 1)) {
      return value === 1;
    }
    return value;
  }
  
  // Convert JSON columns
  convertJson(sql: string): string {
    if (this.dbType === 'sqlite') return sql;
    
    return sql.replace(/JSON/gi, 'JSONB');
  }
  
  // Full SQL conversion
  convertSQL(sql: string): string {
    let converted = sql;
    converted = this.convertPlaceholders(converted);
    converted = this.convertAutoIncrement(converted);
    converted = this.convertDatetime(converted);
    converted = this.convertJson(converted);
    return converted;
  }
  
  // Convert parameters
  convertParams(params: any[]): any[] {
    if (!params) return params;
    
    return params.map(param => {
      if (typeof param === 'boolean' && this.dbType === 'sqlite') {
        return param ? 1 : 0;
      }
      return param;
    });
  }
  
  // Convert result row
  convertResultRow(row: any): any {
    if (!row || this.dbType === 'postgresql') return row;
    
    const converted: any = {};
    for (const key in row) {
      const value = row[key];
      // Convert SQLite boolean integers to actual booleans
      if (
        (key.startsWith('is_') || 
         key.startsWith('notify_') || 
         key.endsWith('_notifications') ||
         key === 'notification_sound' ||
         key === 'show_decommissioned' ||
         key === 'used') &&
        (value === 0 || value === 1)
      ) {
        converted[key] = value === 1;
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }
}

// Create database abstraction
class DatabaseAbstraction implements DatabaseInterface {
  private implementation: DatabaseInterface;
  private converter: QueryConverter;
  
  constructor() {
    const dbType = databaseConfig.type;
    this.converter = new QueryConverter(dbType);
    
    console.log('sqliteModule:', sqliteModule);
    console.log('postgresModule:', postgresModule);
    
    if (dbType === 'postgresql') {
      this.implementation = postgresModule;
    } else {
      this.implementation = sqliteModule;
    }
    
    console.log('implementation:', this.implementation);
    console.log(`✅ Database abstraction initialized for ${dbType}`);
  }
  
  async dbRun(sql: string, params: any[] = []): Promise<any> {
    const convertedSQL = this.converter.convertSQL(sql);
    const convertedParams = this.converter.convertParams(params);
    
    try {
      return await this.implementation.dbRun(convertedSQL, convertedParams);
    } catch (error: any) {
      console.error('Database error in dbRun:', error.message);
      console.error('SQL:', convertedSQL);
      console.error('Params:', convertedParams);
      throw error;
    }
  }
  
  async dbGet(sql: string, params: any[] = []): Promise<any> {
    const convertedSQL = this.converter.convertSQL(sql);
    const convertedParams = this.converter.convertParams(params);
    
    try {
      const result = await this.implementation.dbGet(convertedSQL, convertedParams);
      return result ? this.converter.convertResultRow(result) : null;
    } catch (error: any) {
      console.error('Database error in dbGet:', error.message);
      console.error('SQL:', convertedSQL);
      console.error('Params:', convertedParams);
      throw error;
    }
  }
  
  async dbAll(sql: string, params: any[] = []): Promise<any[]> {
    const convertedSQL = this.converter.convertSQL(sql);
    const convertedParams = this.converter.convertParams(params);
    
    try {
      const results = await this.implementation.dbAll(convertedSQL, convertedParams);
      return results.map(row => this.converter.convertResultRow(row));
    } catch (error: any) {
      console.error('Database error in dbAll:', error.message);
      console.error('SQL:', convertedSQL);
      console.error('Params:', convertedParams);
      throw error;
    }
  }
  
  async initializeDatabase(): Promise<void> {
    return this.implementation.initializeDatabase();
  }
  
  async beginTransaction(): Promise<any> {
    if (this.implementation.beginTransaction) {
      return this.implementation.beginTransaction();
    }
    // For SQLite, we'll start a transaction
    if (databaseConfig.type === 'sqlite') {
      await this.dbRun('BEGIN TRANSACTION');
    }
    return null;
  }
  
  async commitTransaction(client: any): Promise<void> {
    if (this.implementation.commitTransaction && client) {
      return this.implementation.commitTransaction(client);
    }
    // For SQLite, commit the transaction
    if (databaseConfig.type === 'sqlite') {
      await this.dbRun('COMMIT');
    }
  }
  
  async rollbackTransaction(client: any): Promise<void> {
    if (this.implementation.rollbackTransaction && client) {
      return this.implementation.rollbackTransaction(client);
    }
    // For SQLite, rollback the transaction
    if (databaseConfig.type === 'sqlite') {
      await this.dbRun('ROLLBACK');
    }
  }
}

// Create singleton instance
const databaseAbstraction = new DatabaseAbstraction();

// Export the abstracted functions
export const dbRun = (sql: string, params?: any[]) => databaseAbstraction.dbRun(sql, params);
export const dbGet = (sql: string, params?: any[]) => databaseAbstraction.dbGet(sql, params);
export const dbAll = (sql: string, params?: any[]) => databaseAbstraction.dbAll(sql, params);
export const initializeDatabase = () => databaseAbstraction.initializeDatabase();
export const beginTransaction = () => databaseAbstraction.beginTransaction();
export const commitTransaction = (client: any) => databaseAbstraction.commitTransaction(client);
export const rollbackTransaction = (client: any) => databaseAbstraction.rollbackTransaction(client);

// Export the full abstraction for advanced usage
export default databaseAbstraction;