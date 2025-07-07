import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Database configuration interface
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  sqlite?: {
    filename: string;
  };
  postgresql?: {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    poolConfig?: {
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    };
  };
}

// Get database configuration from environment
export const getDatabaseConfig = (): DatabaseConfig => {
  const dbType = process.env.DATABASE_TYPE || 'sqlite';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Force PostgreSQL in production
  if (isProduction && dbType !== 'postgresql') {
    console.warn('⚠️  Production environment detected, forcing PostgreSQL database');
  }
  
  const config: DatabaseConfig = {
    type: (isProduction ? 'postgresql' : dbType) as 'sqlite' | 'postgresql'
  };
  
  if (config.type === 'sqlite') {
    config.sqlite = {
      filename: path.join(process.cwd(), 'data', 'sms.db')
    };
  } else {
    config.postgresql = {
      connectionString: process.env.DATABASE_URL,
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'sms_db',
      user: process.env.PG_USER || 'sms_user',
      password: process.env.PG_PASSWORD || 'sms_pass',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      poolConfig: {
        max: parseInt(process.env.PG_POOL_MAX || '20'),
        idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000')
      }
    };
  }
  
  return config;
};

// Export the configuration
export const databaseConfig = getDatabaseConfig();
export const databaseType = databaseConfig.type;

// Log database configuration (without sensitive data)
console.log(`📊 Database Type: ${databaseConfig.type}`);
if (databaseConfig.type === 'postgresql' && databaseConfig.postgresql) {
  console.log(`📊 PostgreSQL Host: ${databaseConfig.postgresql.host}`);
  console.log(`📊 PostgreSQL Database: ${databaseConfig.postgresql.database}`);
  console.log(`📊 PostgreSQL Pool Max: ${databaseConfig.postgresql.poolConfig?.max}`);
}