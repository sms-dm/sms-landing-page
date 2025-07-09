import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Optional: Add middleware for soft deletes, audit logs, etc.
prisma.$use(async (params, next) => {
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