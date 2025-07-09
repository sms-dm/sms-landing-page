import { Request, Response } from 'express';
// PrismaClient import removed
import logger from '../../services/logger.service';

import { prisma } from '../../services/prisma';

// Get vessels ready for approval
export async function getVesselsForApproval(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch vessels with equipment status counts
    const vessels = await prisma.vessel.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        equipment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Transform data to include counts
    const vesselsWithCounts = vessels.map((vessel) => {
      const equipmentCount = vessel.equipment.length;
      const approvedCount = vessel.equipment.filter((e) => e.status === 'APPROVED').length;
      const pendingCount = vessel.equipment.filter((e) => e.status === 'REVIEWED').length;
      const rejectedCount = vessel.equipment.filter((e) => e.status === 'REJECTED').length;

      return {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.imo,
        equipmentCount,
        approvedCount,
        pendingCount,
        rejectedCount,
        readyForExport: equipmentCount > 0 && approvedCount === equipmentCount,
        lastUpdated: vessel.updatedAt,
      };
    });

    res.json(vesselsWithCounts);
  } catch (error) {
    logger.error('Error fetching vessels for approval', error);
    res.status(500).json({ error: 'Failed to fetch vessels' });
  }
}

// Get export preview for a vessel
export async function getExportPreview(req: Request, res: Response) {
  try {
    const { vesselId } = req.params;
    const userId = (req as any).user.id;

    // Check access
    const vessel = await prisma.vessel.findFirst({
      where: {
        id: vesselId,
        company: {
          users: {
            some: { id: userId },
          },
        },
      },
      include: {
        company: true,
        locations: true,
        equipment: {
          where: { status: 'APPROVED' },
          include: {
            criticalParts: true,
            documents: true,
          },
        },
      },
    });

    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found or access denied' });
    }

    // Calculate statistics
    const statistics = {
      equipmentCount: vessel.equipment.length,
      partsCount: vessel.equipment.reduce((sum, eq) => sum + eq.criticalParts.length, 0),
      documentsCount: vessel.equipment.reduce((sum, eq) => sum + eq.documents.length, 0),
      photosCount: vessel.equipment.reduce(
        (sum, eq) => sum + eq.documents.filter((d) => d.documentType === 'IMAGE').length,
        0
      ),
    };

    // Prepare equipment summary
    const equipmentSummary = vessel.equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      type: eq.equipmentType,
      criticality: eq.criticality,
      partsCount: eq.criticalParts.length,
      documentsCount: eq.documents.length,
    }));

    res.json({
      vessel: {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.imo,
        type: vessel.vesselType,
        flag: vessel.flag,
        company: vessel.company.name,
      },
      equipment: equipmentSummary,
      parts: vessel.equipment.flatMap((eq) => eq.criticalParts),
      statistics,
    });
  } catch (error) {
    logger.error('Error generating export preview', error);
    res.status(500).json({ error: 'Failed to generate export preview' });
  }
}

// Get equipment for review
export async function getEquipmentForReview(req: Request, res: Response) {
  try {
    const { vesselId } = req.params;
    const userId = (req as any).user.id;

    // Check access
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

    const equipment = await prisma.equipment.findMany({
      where: { vesselId },
      include: {
        location: true,
        criticalParts: true,
        documents: {
          where: { documentType: 'IMAGE' },
          take: 5,
        },
        documentedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        qualityScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(equipment);
  } catch (error) {
    logger.error('Error fetching equipment for review', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
}

// Approve equipment
export async function approveEquipment(req: Request, res: Response) {
  try {
    const { equipmentId } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user.id;

    // Check if equipment exists and user has access
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        vessel: {
          company: {
            users: {
              some: { id: userId },
            },
          },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found or access denied' });
    }

    // Update equipment status
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: notes || equipment.notes,
      },
      include: {
        vessel: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: updatedEquipment.vessel.companyId,
        userId,
        action: 'APPROVE_EQUIPMENT',
        entityType: 'equipment',
        entityId: equipmentId,
        details: { notes },
      },
    });

    res.json({
      success: true,
      equipment: updatedEquipment,
    });
  } catch (error) {
    logger.error('Error approving equipment', error);
    res.status(500).json({ error: 'Failed to approve equipment' });
  }
}

// Reject equipment
export async function rejectEquipment(req: Request, res: Response) {
  try {
    const { equipmentId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check if equipment exists and user has access
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        vessel: {
          company: {
            users: {
              some: { id: userId },
            },
          },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found or access denied' });
    }

    // Update equipment status
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: 'REJECTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes: `Rejected: ${reason}`,
      },
      include: {
        vessel: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: updatedEquipment.vessel.companyId,
        userId,
        action: 'REJECT_EQUIPMENT',
        entityType: 'equipment',
        entityId: equipmentId,
        details: { reason },
      },
    });

    res.json({
      success: true,
      equipment: updatedEquipment,
    });
  } catch (error) {
    logger.error('Error rejecting equipment', error);
    res.status(500).json({ error: 'Failed to reject equipment' });
  }
}

// Get team members
export async function getTeamMembers(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get team members (technicians and HSE officers)
    const teamMembers = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: {
          in: ['TECHNICIAN', 'HSE_OFFICER'],
        },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ data: teamMembers });
  } catch (error) {
    logger.error('Error fetching team members', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
}