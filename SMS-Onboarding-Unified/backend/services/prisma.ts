import { PrismaClient } from '@prisma/client';

// Mock Prisma for production when database isn't available
class MockPrismaClient {
  $queryRaw = async () => { throw new Error('Database not available in mock mode'); };
  $disconnect = async () => { console.log('Mock Prisma disconnect'); };
  $use = () => { console.log('Mock Prisma middleware'); };
  
  // Add other methods as needed
  vessel = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: '1', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
  };
  
  equipment = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: '1', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
  };
}

// Check if we should use mock mode
const useMockMode = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

// Create appropriate client
export const prisma = useMockMode 
  ? new MockPrismaClient() as any
  : new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Log which mode we're using
if (useMockMode) {
  console.log('Prisma running in mock mode (no database)');
} else {
  console.log('Prisma connected to database');
}

// Database connection check
export async function checkDatabaseConnection(): Promise<boolean> {
  if (useMockMode) {
    console.log('Mock mode: Database connection check skipped');
    return false;
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Only add middleware if not in mock mode
if (!useMockMode) {
  // Optional: Add middleware for soft deletes, audit logs, etc.
  prisma.$use(async (params: any, next: any) => {
    // Soft delete middleware example
    if (params.model === 'Equipment' || params.model === 'SparePart') {
      if (params.action === 'delete') {
        // Change action to update and set deletedAt
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }
    }

    // Exclude soft deleted records from queries
    if (params.model === 'Equipment' || params.model === 'SparePart') {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = { ...params.args.where, deletedAt: null };
      }
      
      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where = { ...params.args.where, deletedAt: null };
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
    }

    return next(params);
  });
}