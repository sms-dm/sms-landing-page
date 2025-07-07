import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.service';

// Singleton pattern for Prisma client
declare global {
  var prisma: PrismaClient | undefined;
}

// Configure Prisma client with environment-specific settings
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as const
    : ['error', 'warn'] as const,
  errorFormat: 'minimal' as const,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

// Create Prisma client with error handling
function createPrismaClient() {
  try {
    const client = new PrismaClient(prismaClientOptions);
    
    // Add middleware for query logging in development
    if (process.env.NODE_ENV === 'development') {
      client.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
        return result;
      });
    }
    
    return client;
  } catch (error) {
    logger.error('Failed to create Prisma client:', error);
    throw error;
  }
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown with error handling
async function handleShutdown() {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    process.exit(1);
  }
}

process.on('beforeExit', handleShutdown);
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Connection error recovery
prisma.$on('error' as never, (error: any) => {
  logger.error('Prisma client error:', error);
  
  // Implement exponential backoff for reconnection
  if (error.code === 'P1001' || error.code === 'P1002') {
    logger.info('Attempting to reconnect to database...');
    setTimeout(async () => {
      try {
        await checkDatabaseConnection();
      } catch (err) {
        logger.error('Reconnection failed:', err);
      }
    }, 5000);
  }
});