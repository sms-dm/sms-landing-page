import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../services/logger.service';
import { exportService } from '../../services/export.service';

const prisma = new PrismaClient();

interface MaintenancePortalData {
  vessel: any;
  equipment: any[];
  parts: any[];
  documents: any[];
  metadata: {
    exportId: string;
    exportDate: string;
    exportedBy: string;
    format: string;
    includePhotos: boolean;
  };
}

// Transform onboarding data to maintenance portal format
async function transformToMaintenanceFormat(
  vesselId: string,
  includePhotos: boolean = true
): Promise<MaintenancePortalData> {
  // Fetch vessel with all related data
  const vessel = await prisma.vessel.findUnique({
    where: { id: vesselId },
    include: {
      company: true,
      locations: true,
      equipment: {
        include: {
          criticalParts: true,
          documents: includePhotos,
          qualityScores: true,
          documentedByUser: true,
          reviewedByUser: true,
          approvedByUser: true,
        },
      },
    },
  });

  if (!vessel) {
    throw new Error('Vessel not found');
  }

  // Transform equipment data for maintenance portal
  const transformedEquipment = vessel.equipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
    code: eq.code,
    type: eq.equipmentType,
    manufacturer: eq.manufacturer,
    model: eq.model,
    serialNumber: eq.serialNumber,
    criticality: eq.criticality,
    location: vessel.locations.find((loc) => loc.id === eq.locationId),
    maintenanceSchedule: {
      intervalDays: eq.maintenanceIntervalDays,
      lastMaintenance: eq.lastMaintenanceDate,
      nextMaintenance: eq.nextMaintenanceDate,
    },
    specifications: eq.specifications,
    qualityScore: eq.qualityScore,
    approvalDetails: {
      documentedBy: eq.documentedByUser
        ? `${eq.documentedByUser.firstName} ${eq.documentedByUser.lastName}`
        : null,
      documentedAt: eq.documentedAt,
      reviewedBy: eq.reviewedByUser
        ? `${eq.reviewedByUser.firstName} ${eq.reviewedByUser.lastName}`
        : null,
      reviewedAt: eq.reviewedAt,
      approvedBy: eq.approvedByUser
        ? `${eq.approvedByUser.firstName} ${eq.approvedByUser.lastName}`
        : null,
      approvedAt: eq.approvedAt,
    },
    metadata: eq.metadata,
  }));

  // Extract all critical parts
  const allParts = vessel.equipment.flatMap((eq) =>
    eq.criticalParts.map((part) => ({
      ...part,
      equipmentId: eq.id,
      equipmentName: eq.name,
    }))
  );

  // Extract all documents if including photos
  const allDocuments = includePhotos
    ? vessel.equipment.flatMap((eq) =>
        eq.documents.map((doc) => ({
          ...doc,
          equipmentId: eq.id,
          equipmentName: eq.name,
        }))
      )
    : [];

  return {
    vessel: {
      id: vessel.id,
      name: vessel.name,
      imo: vessel.imo,
      type: vessel.vesselType,
      flag: vessel.flag,
      company: {
        id: vessel.company.id,
        name: vessel.company.name,
        code: vessel.company.code,
      },
      specifications: vessel.specifications,
      locations: vessel.locations,
    },
    equipment: transformedEquipment,
    parts: allParts,
    documents: allDocuments,
    metadata: {
      exportId: uuidv4(),
      exportDate: new Date().toISOString(),
      exportedBy: '',
      format: 'json',
      includePhotos,
    },
  };
}

// Export vessel data to maintenance portal
export async function exportToMaintenance(req: Request, res: Response) {
  try {
    const { vesselId, includePhotos = true, format = 'json' } = req.body;
    const userId = (req as any).user.id;

    logger.info('Starting maintenance portal export', { vesselId, userId, format });

    // Check vessel exists and user has access
    const vessel = await prisma.vessel.findFirst({
      where: {
        id: vesselId,
        company: {
          users: {
            some: { id: userId },
          },
        },
      },
    });

    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found or access denied' });
    }

    // Check if vessel is approved for export
    const approvedEquipmentCount = await prisma.equipment.count({
      where: {
        vesselId,
        status: 'APPROVED',
      },
    });

    if (approvedEquipmentCount === 0) {
      return res.status(400).json({
        error: 'No approved equipment found. Please approve equipment before exporting.',
      });
    }

    // Transform data
    const maintenanceData = await transformToMaintenanceFormat(vesselId, includePhotos);
    maintenanceData.metadata.exportedBy = userId;

    // Create export record
    const exportRecord = await prisma.auditLog.create({
      data: {
        companyId: vessel.companyId,
        userId,
        action: 'EXPORT_TO_MAINTENANCE',
        entityType: 'vessel',
        entityId: vesselId,
        details: {
          format,
          includePhotos,
          equipmentCount: maintenanceData.equipment.length,
          partsCount: maintenanceData.parts.length,
          documentsCount: maintenanceData.documents.length,
        },
      },
    });

    // Update vessel onboarding status
    await prisma.vessel.update({
      where: { id: vesselId },
      data: { onboardingStatus: 'EXPORTED' },
    });

    // Generate export based on format
    let exportResult;
    switch (format) {
      case 'json':
        exportResult = maintenanceData;
        res.json({
          success: true,
          exportId: maintenanceData.metadata.exportId,
          data: exportResult,
          maintenancePortalUrl: `${process.env.MAINTENANCE_PORTAL_URL}/import/${maintenanceData.metadata.exportId}`,
        });
        break;

      case 'xml':
        exportResult = await generateXMLExport(maintenanceData);
        res.set('Content-Type', 'application/xml');
        res.send(exportResult);
        break;

      case 'csv':
        exportResult = await generateCSVExport(maintenanceData);
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename="vessel-${vesselId}-export.csv"`);
        res.send(exportResult);
        break;

      default:
        return res.status(400).json({ error: 'Invalid export format' });
    }

    logger.info('Maintenance portal export completed', {
      vesselId,
      exportId: maintenanceData.metadata.exportId,
      format,
    });
  } catch (error) {
    logger.error('Error exporting to maintenance portal', error);
    res.status(500).json({ error: 'Failed to export to maintenance portal' });
  }
}

// Sync users with maintenance portal
export async function syncUsers(req: Request, res: Response) {
  try {
    const { companyId } = req.body;
    const requestingUserId = (req as any).user.id;

    logger.info('Starting user sync with maintenance portal', { companyId, requestingUserId });

    const whereClause = companyId ? { companyId } : {};
    const users = await prisma.user.findMany({
      where: {
        ...whereClause,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Prepare users for maintenance portal
    const syncData = {
      users: users.map((user) => ({
        externalId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: mapRoleToMaintenancePortal(user.role),
        phone: user.phone,
        company: {
          externalId: user.company.id,
          name: user.company.name,
          code: user.company.code,
        },
      })),
      syncId: uuidv4(),
      syncDate: new Date().toISOString(),
    };

    // In a real implementation, this would make an API call to the maintenance portal
    // For now, we'll simulate the sync
    logger.info('User sync data prepared', {
      userCount: syncData.users.length,
      syncId: syncData.syncId,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: companyId || users[0]?.company.id,
        userId: requestingUserId,
        action: 'SYNC_USERS',
        entityType: 'user',
        entityId: null,
        details: {
          userCount: syncData.users.length,
          syncId: syncData.syncId,
        },
      },
    });

    res.json({
      success: true,
      syncId: syncData.syncId,
      userCount: syncData.users.length,
      message: 'Users synced successfully',
    });
  } catch (error) {
    logger.error('Error syncing users', error);
    res.status(500).json({ error: 'Failed to sync users' });
  }
}

// Handle progress webhook from maintenance portal
export async function handleProgressWebhook(req: Request, res: Response) {
  try {
    const { exportId, status, progress, message } = req.body;

    logger.info('Received progress webhook', { exportId, status, progress });

    // Verify webhook signature (in production)
    // const signature = req.headers['x-webhook-signature'];
    // if (!verifyWebhookSignature(req.body, signature)) {
    //   return res.status(401).json({ error: 'Invalid webhook signature' });
    // }

    // Update export status in database
    // For now, we'll just log it
    logger.info('Processing webhook update', {
      exportId,
      status,
      progress,
      message,
    });

    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

// Helper function to map roles
function mapRoleToMaintenancePortal(role: string): string {
  const roleMapping: Record<string, string> = {
    SUPER_ADMIN: 'admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    TECHNICIAN: 'technician',
    HSE_OFFICER: 'hse_officer',
    VIEWER: 'viewer',
  };
  return roleMapping[role] || 'viewer';
}

// Generate XML export
async function generateXMLExport(data: MaintenancePortalData): Promise<string> {
  // Simple XML generation - in production, use a proper XML library
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<maintenanceExport>\n';
  xml += `  <metadata>\n`;
  xml += `    <exportId>${data.metadata.exportId}</exportId>\n`;
  xml += `    <exportDate>${data.metadata.exportDate}</exportDate>\n`;
  xml += `    <exportedBy>${data.metadata.exportedBy}</exportedBy>\n`;
  xml += `  </metadata>\n`;
  xml += `  <vessel>\n`;
  xml += `    <id>${data.vessel.id}</id>\n`;
  xml += `    <name>${data.vessel.name}</name>\n`;
  xml += `    <imo>${data.vessel.imo}</imo>\n`;
  xml += `  </vessel>\n`;
  xml += `  <equipment>\n`;
  data.equipment.forEach((eq) => {
    xml += `    <item>\n`;
    xml += `      <id>${eq.id}</id>\n`;
    xml += `      <name>${eq.name}</name>\n`;
    xml += `      <type>${eq.type || ''}</type>\n`;
    xml += `    </item>\n`;
  });
  xml += `  </equipment>\n`;
  xml += '</maintenanceExport>';
  return xml;
}

// Generate CSV export
async function generateCSVExport(data: MaintenancePortalData): Promise<string> {
  // Simple CSV generation for equipment
  let csv = 'Equipment ID,Name,Type,Manufacturer,Model,Serial Number,Criticality,Quality Score\n';
  data.equipment.forEach((eq) => {
    csv += `"${eq.id}","${eq.name}","${eq.type || ''}","${eq.manufacturer || ''}","${
      eq.model || ''
    }","${eq.serialNumber || ''}","${eq.criticality}","${eq.qualityScore}"\n`;
  });
  return csv;
}