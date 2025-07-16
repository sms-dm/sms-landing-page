import { Request, Response } from 'express';
import { prisma } from '../../services/prisma';
import { logger } from '../../services/logger.service';
import { SyncStatus } from '@prisma/client';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
  };
}

// Push changes from offline client
export const syncPush = async (req: AuthRequest, res: Response) => {
  try {
    const { changes, lastSyncTimestamp, deviceId } = req.body;
    const user = req.user;

    const syncResults = await Promise.allSettled(
      changes.map(async (change: any) => {
        const { id, entityType, entityId, action, data, timestamp, version } = change;

        // Check for conflicts by looking at server version
        let hasConflict = false;
        let serverData = null;

        if (action === 'update') {
          // Check if the entity exists and compare versions
          switch (entityType) {
            case 'vessel':
              serverData = await prisma.vessel.findUnique({
                where: { id: entityId },
              });
              break;
            case 'equipment':
              serverData = await prisma.equipment.findUnique({
                where: { id: entityId },
              });
              break;
            case 'part':
              serverData = await prisma.criticalPart.findUnique({
                where: { id: entityId },
              });
              break;
          }

          if (serverData && serverData.updatedAt > new Date(timestamp)) {
            hasConflict = true;
          }
        }

        // Store in sync queue
        const syncQueueEntry = await prisma.offlineSyncQueue.create({
          data: {
            userId: user!.id,
            deviceId: deviceId || 'unknown',
            entityType,
            entityId,
            operation: action.toUpperCase(),
            data,
            syncStatus: hasConflict ? SyncStatus.FAILED : SyncStatus.PENDING,
            syncError: hasConflict ? 'Version conflict detected' : null,
            clientTimestamp: new Date(timestamp),
            metadata: {
              changeId: id,
              version,
              hasConflict,
              serverVersion: serverData?.updatedAt,
            },
          },
        });

        // Process the change if no conflict
        if (!hasConflict) {
          switch (entityType) {
            case 'vessel':
              await processVesselChange(action, entityId, data, user!);
              break;
            case 'equipment':
              await processEquipmentChange(action, entityId, data, user!);
              break;
            case 'part':
              await processPartChange(action, entityId, data, user!);
              break;
          }

          // Update sync status
          await prisma.offlineSyncQueue.update({
            where: { id: syncQueueEntry.id },
            data: {
              syncStatus: SyncStatus.COMPLETED,
              serverTimestamp: new Date(),
            },
          });
        }

        return {
          changeId: id,
          status: hasConflict ? 'conflict' : 'success',
          serverData: hasConflict ? serverData : null,
        };
      })
    );

    // Separate results
    const results = syncResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          changeId: changes[index].id,
          status: 'error',
          error: result.reason.message,
        };
      }
    });

    const successful = results.filter(r => r.status === 'success').length;
    const conflicts = results.filter(r => r.status === 'conflict').length;
    const errors = results.filter(r => r.status === 'error').length;

    logger.info(`Sync push completed: ${successful} successful, ${conflicts} conflicts, ${errors} errors`);

    res.json({
      data: {
        results,
        summary: {
          total: changes.length,
          successful,
          conflicts,
          errors,
        },
        serverTimestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error in sync push:', error);
    res.status(500).json({ message: 'Error processing sync push' });
  }
};

// Pull changes from server
export const syncPull = async (req: AuthRequest, res: Response) => {
  try {
    const { lastSyncTimestamp, entityTypes, vesselIds } = req.body;
    const user = req.user;
    const lastSync = new Date(lastSyncTimestamp);

    const changes: any[] = [];

    // Fetch vessels if requested
    if (!entityTypes || entityTypes.includes('vessels')) {
      const vesselWhere: any = {
        companyId: user!.companyId,
        updatedAt: { gt: lastSync },
      };

      if (vesselIds && vesselIds.length > 0) {
        vesselWhere.id = { in: vesselIds };
      }

      const vessels = await prisma.vessel.findMany({
        where: vesselWhere,
        include: {
          locations: true,
        },
      });

      vessels.forEach(vessel => {
        changes.push({
          entityType: 'vessel',
          entityId: vessel.id,
          action: vessel.createdAt > lastSync ? 'create' : 'update',
          data: vessel,
          timestamp: vessel.updatedAt,
        });
      });
    }

    // Fetch equipment if requested
    if (!entityTypes || entityTypes.includes('equipment')) {
      const equipmentWhere: any = {
        vessel: {
          companyId: user!.companyId,
        },
        updatedAt: { gt: lastSync },
      };

      if (vesselIds && vesselIds.length > 0) {
        equipmentWhere.vesselId = { in: vesselIds };
      }

      const equipment = await prisma.equipment.findMany({
        where: equipmentWhere,
        include: {
          location: true,
          criticalParts: true,
          documents: true,
        },
      });

      equipment.forEach(eq => {
        changes.push({
          entityType: 'equipment',
          entityId: eq.id,
          action: eq.createdAt > lastSync ? 'create' : 'update',
          data: eq,
          timestamp: eq.updatedAt,
        });
      });
    }

    // Fetch parts if requested
    if (!entityTypes || entityTypes.includes('parts')) {
      const partsWhere: any = {
        equipment: {
          vessel: {
            companyId: user!.companyId,
          },
        },
        updatedAt: { gt: lastSync },
      };

      if (vesselIds && vesselIds.length > 0) {
        partsWhere.equipment = {
          vesselId: { in: vesselIds },
        };
      }

      const parts = await prisma.criticalPart.findMany({
        where: partsWhere,
      });

      parts.forEach(part => {
        changes.push({
          entityType: 'part',
          entityId: part.id,
          action: part.createdAt > lastSync ? 'create' : 'update',
          data: part,
          timestamp: part.updatedAt,
        });
      });
    }

    // Sort changes by timestamp
    changes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    logger.info(`Sync pull completed: ${changes.length} changes found for user ${user?.id}`);

    res.json({
      data: {
        changes,
        serverTimestamp: new Date(),
        hasMore: false, // Could implement pagination if needed
      },
    });
  } catch (error) {
    logger.error('Error in sync pull:', error);
    res.status(500).json({ message: 'Error fetching sync data' });
  }
};

// Helper functions to process changes
async function processVesselChange(action: string, entityId: string, data: any, user: any) {
  switch (action) {
    case 'create':
      await prisma.vessel.create({
        data: {
          ...data,
          id: entityId,
          companyId: user.companyId,
        },
      });
      break;
    case 'update':
      await prisma.vessel.update({
        where: { id: entityId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      break;
    case 'delete':
      await prisma.vessel.update({
        where: { id: entityId },
        data: { isActive: false },
      });
      break;
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      entityType: 'vessel',
      entityId,
      action: action.toUpperCase(),
      newValues: data,
      metadata: { source: 'offline_sync' },
    },
  });
}

async function processEquipmentChange(action: string, entityId: string, data: any, user: any) {
  switch (action) {
    case 'create':
      // Remove nested relations from data
      const { criticalParts, documents, location, ...equipmentData } = data;
      
      await prisma.equipment.create({
        data: {
          ...equipmentData,
          id: entityId,
        },
      });

      // Handle critical parts if provided
      if (criticalParts && criticalParts.length > 0) {
        await prisma.criticalPart.createMany({
          data: criticalParts.map((part: any) => ({
            ...part,
            equipmentId: entityId,
          })),
        });
      }
      break;
    case 'update':
      const { criticalParts: parts, documents: docs, location: loc, ...updateData } = data;
      
      await prisma.equipment.update({
        where: { id: entityId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
      break;
    case 'delete':
      await prisma.equipment.update({
        where: { id: entityId },
        data: { status: 'DELETED' },
      });
      break;
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      entityType: 'equipment',
      entityId,
      action: action.toUpperCase(),
      newValues: data,
      metadata: { source: 'offline_sync' },
    },
  });
}

async function processPartChange(action: string, entityId: string, data: any, user: any) {
  switch (action) {
    case 'create':
      await prisma.criticalPart.create({
        data: {
          ...data,
          id: entityId,
        },
      });
      break;
    case 'update':
      await prisma.criticalPart.update({
        where: { id: entityId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      break;
    case 'delete':
      await prisma.criticalPart.delete({
        where: { id: entityId },
      });
      break;
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      entityType: 'part',
      entityId,
      action: action.toUpperCase(),
      newValues: data,
      metadata: { source: 'offline_sync' },
    },
  });
}