import { databaseConfig } from '../config/database.config';
import { dbGet, dbRun, dbAll } from '../config/database.abstraction';

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  type: string;
  details: any;
}> {
  try {
    console.log(`🏥 Checking ${databaseConfig.type} database health...`);
    
    // Test basic connectivity
    const testQuery = databaseConfig.type === 'postgresql' 
      ? 'SELECT 1 as test, NOW() as timestamp'
      : "SELECT 1 as test, datetime('now') as timestamp";
    
    const result = await dbGet(testQuery);
    
    if (!result) {
      throw new Error('No result from test query');
    }
    
    // Get table count
    let tableCount = 0;
    if (databaseConfig.type === 'postgresql') {
      const tables = await dbAll(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      tableCount = tables.length;
    } else {
      const tables = await dbAll(`
        SELECT name 
        FROM sqlite_master 
        WHERE type = 'table' 
        AND name NOT LIKE 'sqlite_%'
      `);
      tableCount = tables.length;
    }
    
    // Get record counts for main tables
    const recordCounts: Record<string, number> = {};
    const mainTables = ['users', 'companies', 'vessels', 'equipment', 'faults'];
    
    for (const table of mainTables) {
      try {
        const countResult = await dbGet(`SELECT COUNT(*) as count FROM ${table}`);
        recordCounts[table] = countResult?.count || 0;
      } catch (err) {
        recordCounts[table] = -1; // Table doesn't exist
      }
    }
    
    return {
      status: 'healthy',
      type: databaseConfig.type,
      details: {
        timestamp: result.timestamp,
        tableCount,
        recordCounts,
        config: databaseConfig.type === 'postgresql' && databaseConfig.postgresql ? {
          host: databaseConfig.postgresql.host,
          database: databaseConfig.postgresql.database,
          poolMax: databaseConfig.postgresql.poolConfig?.max
        } : {
          filename: databaseConfig.sqlite?.filename
        }
      }
    };
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.message);
    return {
      status: 'unhealthy',
      type: databaseConfig.type,
      details: {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }
}

// Run health check if called directly
if (require.main === module) {
  checkDatabaseHealth()
    .then(result => {
      console.log('\n📊 Database Health Check Results:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.status === 'healthy' ? 0 : 1);
    })
    .catch(err => {
      console.error('Failed to run health check:', err);
      process.exit(1);
    });
}