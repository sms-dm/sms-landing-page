import { prisma, checkDatabaseConnection } from '../lib/prisma';
import { logger } from '../services/logger.service';

export interface DatabaseHealth {
  connected: boolean;
  latency: number;
  error?: string;
  details?: {
    databaseType: string;
    version?: string;
    tablesCount?: number;
  };
}

/**
 * Performs a comprehensive database health check
 */
export async function performDatabaseHealthCheck(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  
  try {
    // Basic connection check
    const connected = await checkDatabaseConnection();
    
    if (!connected) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        error: 'Failed to connect to database'
      };
    }
    
    // Get database details
    const isDevelopment = process.env.NODE_ENV === 'development';
    const databaseType = isDevelopment ? 'SQLite' : 'PostgreSQL';
    
    let version: string | undefined;
    let tablesCount: number | undefined;
    
    try {
      if (isDevelopment) {
        // SQLite version
        const versionResult = await prisma.$queryRaw<{version: string}[]>`SELECT sqlite_version() as version`;
        version = versionResult[0]?.version;
        
        // Count tables
        const tablesResult = await prisma.$queryRaw<{count: number}[]>`
          SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
        `;
        tablesCount = Number(tablesResult[0]?.count || 0);
      } else {
        // PostgreSQL version
        const versionResult = await prisma.$queryRaw<{version: string}[]>`SELECT version()`;
        version = versionResult[0]?.version;
        
        // Count tables
        const tablesResult = await prisma.$queryRaw<{count: bigint}[]>`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        tablesCount = Number(tablesResult[0]?.count || 0);
      }
    } catch (error) {
      logger.warn('Failed to get database details:', error);
    }
    
    return {
      connected: true,
      latency: Date.now() - startTime,
      details: {
        databaseType,
        version,
        tablesCount
      }
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    
    return {
      connected: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Monitors database connection and logs warnings if latency is high
 */
export async function monitorDatabaseConnection(): Promise<void> {
  const health = await performDatabaseHealthCheck();
  
  if (!health.connected) {
    logger.error('Database connection is down', { error: health.error });
    return;
  }
  
  if (health.latency > 1000) {
    logger.warn('High database latency detected', { latency: health.latency });
  } else if (health.latency > 500) {
    logger.info('Moderate database latency', { latency: health.latency });
  }
  
  logger.info('Database health check passed', {
    latency: health.latency,
    ...health.details
  });
}