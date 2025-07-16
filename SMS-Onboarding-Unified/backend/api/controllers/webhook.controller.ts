import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../../services/prisma';
import { logger } from '../../services/logger.service';
import { config } from '../../config';
import { OnboardingStatus } from '@prisma/client';

// Handle progress webhooks from onboarding portal
export const handleProgressWebhook = async (req: Request, res: Response) => {
  try {
    const { vesselId, event, data, timestamp } = req.body;

    // Log webhook receipt
    await logWebhook('progress', req.body);

    switch (event) {
      case 'equipment.added':
        await handleEquipmentAdded(vesselId, data);
        break;
      case 'equipment.updated':
        await handleEquipmentUpdated(vesselId, data);
        break;
      case 'equipment.verified':
        await handleEquipmentVerified(vesselId, data);
        break;
      case 'vessel.completed':
        await handleVesselCompleted(vesselId, data);
        break;
      default:
        logger.warn(`Unknown webhook event: ${event}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing progress webhook:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

// Handle maintenance sync webhooks
export const handleMaintenanceSync = async (req: Request, res: Response) => {
  try {
    const { action, data } = req.body;

    // Log webhook receipt
    await logWebhook('maintenance-sync', req.body);

    switch (action) {
      case 'user.created':
        await syncUserCreated(data);
        break;
      case 'user.updated':
        await syncUserUpdated(data);
        break;
      case 'user.deleted':
        await syncUserDeleted(data);
        break;
      default:
        logger.warn(`Unknown maintenance sync action: ${action}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing maintenance sync webhook:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

// Handle stock update webhooks
export const handleStockUpdate = async (req: Request, res: Response) => {
  try {
    const { partId, action, data } = req.body;

    // Log webhook receipt
    await logWebhook('stock-update', req.body);

    switch (action) {
      case 'stock.updated':
        await updatePartStock(partId, data);
        break;
      case 'order.placed':
        await handleOrderPlaced(partId, data);
        break;
      case 'order.delivered':
        await handleOrderDelivered(partId, data);
        break;
      default:
        logger.warn(`Unknown stock update action: ${action}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing stock update webhook:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

// Helper functions
async function logWebhook(type: string, payload: any) {
  try {
    // Store webhook log in database (if webhook log table exists)
    // For now, just log to file
    logger.info(`Webhook received - Type: ${type}`, { payload });
  } catch (error) {
    logger.error('Error logging webhook:', error);
  }
}

async function handleEquipmentAdded(vesselId: string, data: any) {
  try {
    // Update vessel onboarding status if needed
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (vessel && vessel.onboardingStatus === OnboardingStatus.NOT_STARTED) {
      await prisma.vessel.update({
        where: { id: vesselId },
        data: { onboardingStatus: OnboardingStatus.IN_PROGRESS },
      });
    }

    // Send notification to maintenance portal if configured
    if (config.integration.maintenanceApiUrl) {
      await notifyMaintenancePortal('equipment.added', {
        vesselId,
        equipmentId: data.equipmentId,
        equipmentData: data,
      });
    }

    logger.info(`Equipment added webhook processed for vessel ${vesselId}`);
  } catch (error) {
    logger.error('Error handling equipment added:', error);
    throw error;
  }
}

async function handleEquipmentUpdated(vesselId: string, data: any) {
  try {
    // Send update to maintenance portal if configured
    if (config.integration.maintenanceApiUrl) {
      await notifyMaintenancePortal('equipment.updated', {
        vesselId,
        equipmentId: data.equipmentId,
        updates: data.updates,
      });
    }

    logger.info(`Equipment updated webhook processed for vessel ${vesselId}`);
  } catch (error) {
    logger.error('Error handling equipment updated:', error);
    throw error;
  }
}

async function handleEquipmentVerified(vesselId: string, data: any) {
  try {
    const { equipmentId, verifiedBy, qualityScore } = data;

    // Create notification for vessel managers
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: { company: true },
    });

    if (vessel) {
      const managers = await prisma.user.findMany({
        where: {
          companyId: vessel.companyId,
          role: { in: ['MANAGER', 'ADMIN'] },
        },
      });

      await prisma.notification.createMany({
        data: managers.map(manager => ({
          userId: manager.id,
          type: 'EQUIPMENT_VERIFIED',
          title: 'Equipment Verified',
          message: `Equipment has been verified on vessel ${vessel.name}`,
          data: {
            vesselId,
            equipmentId,
            qualityScore,
          },
        })),
      });
    }

    logger.info(`Equipment verified webhook processed for vessel ${vesselId}`);
  } catch (error) {
    logger.error('Error handling equipment verified:', error);
    throw error;
  }
}

async function handleVesselCompleted(vesselId: string, data: any) {
  try {
    // Update vessel status
    await prisma.vessel.update({
      where: { id: vesselId },
      data: { onboardingStatus: OnboardingStatus.APPROVED },
    });

    // Notify maintenance portal
    if (config.integration.maintenanceApiUrl) {
      await notifyMaintenancePortal('vessel.completed', {
        vesselId,
        completionData: data,
      });
    }

    // Create notifications
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: { company: true },
    });

    if (vessel) {
      const admins = await prisma.user.findMany({
        where: {
          companyId: vessel.companyId,
          role: 'ADMIN',
        },
      });

      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'VESSEL_COMPLETED',
          title: 'Vessel Onboarding Completed',
          message: `Vessel ${vessel.name} has completed onboarding`,
          data: { vesselId },
        })),
      });
    }

    logger.info(`Vessel completed webhook processed for vessel ${vesselId}`);
  } catch (error) {
    logger.error('Error handling vessel completed:', error);
    throw error;
  }
}

async function syncUserCreated(userData: any) {
  try {
    const { email, firstName, lastName, role, companyId } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      // Create user with temporary password
      await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: role || 'VIEWER',
          companyId,
          passwordHash: 'SYNC_FROM_MAINTENANCE', // Will need to set password on first login
          settings: {
            requirePasswordChange: true,
            syncedFromMaintenance: true,
          },
        },
      });

      logger.info(`User created from maintenance sync: ${email}`);
    }
  } catch (error) {
    logger.error('Error syncing user creation:', error);
    throw error;
  }
}

async function syncUserUpdated(userData: any) {
  try {
    const { userId, email, updates } = userData;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email },
        ],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      logger.info(`User updated from maintenance sync: ${user.email}`);
    }
  } catch (error) {
    logger.error('Error syncing user update:', error);
    throw error;
  }
}

async function syncUserDeleted(userData: any) {
  try {
    const { userId, email } = userData;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email },
        ],
      },
    });

    if (user) {
      // Soft delete - deactivate user
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      logger.info(`User deactivated from maintenance sync: ${user.email}`);
    }
  } catch (error) {
    logger.error('Error syncing user deletion:', error);
    throw error;
  }
}

async function updatePartStock(partId: string, data: any) {
  try {
    const { currentStock, minimumStock, location } = data;

    const part = await prisma.criticalPart.findUnique({
      where: { id: partId },
    });

    if (part) {
      await prisma.criticalPart.update({
        where: { id: partId },
        data: {
          quantity: currentStock,
          minimumQuantity: minimumStock || part.minimumQuantity,
          metadata: {
            ...((part.metadata as any) || {}),
            lastStockUpdate: new Date(),
            stockLocation: location,
          },
        },
      });

      // Check if stock is below minimum
      if (currentStock < (minimumStock || part.minimumQuantity)) {
        await createLowStockNotification(part);
      }

      logger.info(`Part stock updated: ${partId}`);
    }
  } catch (error) {
    logger.error('Error updating part stock:', error);
    throw error;
  }
}

async function handleOrderPlaced(partId: string, data: any) {
  try {
    const { orderId, quantity, expectedDelivery } = data;

    const part = await prisma.criticalPart.findUnique({
      where: { id: partId },
      include: { equipment: true },
    });

    if (part) {
      // Update part metadata with order info
      await prisma.criticalPart.update({
        where: { id: partId },
        data: {
          metadata: {
            ...((part.metadata as any) || {}),
            pendingOrders: [
              ...((part.metadata as any)?.pendingOrders || []),
              {
                orderId,
                quantity,
                expectedDelivery,
                placedAt: new Date(),
              },
            ],
          },
        },
      });

      logger.info(`Order placed for part: ${partId}`);
    }
  } catch (error) {
    logger.error('Error handling order placed:', error);
    throw error;
  }
}

async function handleOrderDelivered(partId: string, data: any) {
  try {
    const { orderId, deliveredQuantity, deliveryDate } = data;

    const part = await prisma.criticalPart.findUnique({
      where: { id: partId },
    });

    if (part) {
      // Update stock quantity
      await prisma.criticalPart.update({
        where: { id: partId },
        data: {
          quantity: part.quantity + deliveredQuantity,
          metadata: {
            ...((part.metadata as any) || {}),
            pendingOrders: ((part.metadata as any)?.pendingOrders || [])
              .filter((order: any) => order.orderId !== orderId),
            deliveredOrders: [
              ...((part.metadata as any)?.deliveredOrders || []),
              {
                orderId,
                deliveredQuantity,
                deliveryDate,
              },
            ],
          },
        },
      });

      logger.info(`Order delivered for part: ${partId}`);
    }
  } catch (error) {
    logger.error('Error handling order delivered:', error);
    throw error;
  }
}

async function createLowStockNotification(part: any) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: part.equipmentId },
      include: { vessel: true },
    });

    if (equipment) {
      const managers = await prisma.user.findMany({
        where: {
          companyId: equipment.vessel.companyId,
          role: { in: ['MANAGER', 'ADMIN'] },
        },
      });

      await prisma.notification.createMany({
        data: managers.map(manager => ({
          userId: manager.id,
          type: 'LOW_STOCK_ALERT',
          title: 'Low Stock Alert',
          message: `Part ${part.partName} is below minimum stock level`,
          data: {
            partId: part.id,
            partName: part.partName,
            currentStock: part.quantity,
            minimumStock: part.minimumQuantity,
            equipmentId: equipment.id,
            vesselId: equipment.vesselId,
          },
        })),
      });
    }
  } catch (error) {
    logger.error('Error creating low stock notification:', error);
  }
}

async function notifyMaintenancePortal(event: string, data: any) {
  try {
    const url = `${config.integration.maintenanceApiUrl}/api/webhooks/onboarding-update`;
    
    await axios.post(url, {
      event,
      data,
      timestamp: new Date(),
    }, {
      headers: {
        'Authorization': `Bearer ${config.integration.maintenanceApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    logger.info(`Notified maintenance portal of event: ${event}`);
  } catch (error) {
    logger.error('Error notifying maintenance portal:', error);
    // Don't throw - we don't want webhook processing to fail if notification fails
  }
}