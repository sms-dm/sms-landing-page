import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { EquipmentStatus } from '../../types/entities';

export const listManagerEquipment = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      vesselId,
      status,
      criticalLevel,
      location,
      assignedTo,
      dateFrom,
      dateTo,
      sort = 'createdAt:desc'
    } = req.query;

    const where: any = {
      vessel: {
        companyId: (req as any).user.companyId
      }
    };

    if (vesselId) where.vesselId = vesselId;
    if (status) where.status = status;
    if (criticalLevel) where.criticality = criticalLevel;
    if (location) where.locationId = location;
    if (assignedTo) where.documentedBy = assignedTo;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [sortField, sortOrder] = (sort as string).split(':');
    const orderBy = { [sortField]: sortOrder };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: {
          vessel: true,
          location: true,
          documentedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reviewedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          criticalParts: {
            include: {
              documents: true
            }
          },
          documents: true,
          qualityScores: true
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.equipment.count({ where })
    ]);

    res.json({
      data: equipment,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error listing manager equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment' });
  }
};

export const createManagerEquipment = async (req: Request, res: Response) => {
  try {
    const { vesselId, equipment: equipmentList } = req.body;
    const userId = (req as any).user.id;

    // Verify vessel belongs to user's company
    const vessel = await prisma.vessel.findFirst({
      where: {
        id: vesselId,
        companyId: (req as any).user.companyId
      }
    });

    if (!vessel) {
      return res.status(404).json({ message: 'Vessel not found' });
    }

    // Create equipment in bulk
    const createdEquipment = await prisma.equipment.createMany({
      data: equipmentList.map((eq: any) => ({
        ...eq,
        vesselId,
        status: eq.status || EquipmentStatus.PLANNED,
        documentedBy: eq.assignedTo || userId,
        qualityScore: 0,
        metadata: eq.metadata || {}
      }))
    });

    res.status(201).json({
      message: `${createdEquipment.count} equipment items created successfully`,
      count: createdEquipment.count
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment' });
  }
};

export const updateManagerEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const updates = req.body;

    // Verify equipment belongs to user's company
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        vessel: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Handle status transitions
    const statusTransitionData: any = {};
    if (updates.status && updates.status !== equipment.status) {
      switch (updates.status) {
        case EquipmentStatus.VERIFIED:
          statusTransitionData.reviewedBy = (req as any).user.id;
          statusTransitionData.reviewedAt = new Date();
          break;
        case EquipmentStatus.APPROVED:
          statusTransitionData.approvedBy = (req as any).user.id;
          statusTransitionData.approvedAt = new Date();
          break;
      }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        ...updates,
        ...statusTransitionData
      },
      include: {
        vessel: true,
        location: true,
        documentedByUser: true,
        criticalParts: true,
        documents: true
      }
    });

    res.json({
      data: updatedEquipment,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Error updating equipment' });
  }
};

export const bulkUpdateEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentIds, updates } = req.body;

    // Verify all equipment belongs to user's company
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        vessel: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (equipment.length !== equipmentIds.length) {
      return res.status(403).json({ message: 'Some equipment not found or unauthorized' });
    }

    // Handle status transitions
    const statusTransitionData: any = {};
    if (updates.status) {
      switch (updates.status) {
        case EquipmentStatus.VERIFIED:
          statusTransitionData.reviewedBy = (req as any).user.id;
          statusTransitionData.reviewedAt = new Date();
          break;
        case EquipmentStatus.APPROVED:
          statusTransitionData.approvedBy = (req as any).user.id;
          statusTransitionData.approvedAt = new Date();
          break;
      }
    }

    const result = await prisma.equipment.updateMany({
      where: {
        id: { in: equipmentIds }
      },
      data: {
        ...updates,
        ...statusTransitionData
      }
    });

    res.json({
      message: `${result.count} equipment items updated successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Error bulk updating equipment:', error);
    res.status(500).json({ message: 'Error updating equipment' });
  }
};

export const deleteManagerEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;

    // Verify equipment belongs to user's company
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        vessel: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Soft delete by updating status
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: EquipmentStatus.REMOVED,
        metadata: {
          ...(equipment.metadata as any),
          removedAt: new Date(),
          removedBy: (req as any).user.id
        }
      }
    });

    res.json({ message: 'Equipment removed successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Error deleting equipment' });
  }
};

export const bulkDeleteEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentIds } = req.body;

    // Verify all equipment belongs to user's company
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        vessel: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (equipment.length !== equipmentIds.length) {
      return res.status(403).json({ message: 'Some equipment not found or unauthorized' });
    }

    // Soft delete by updating status
    const result = await prisma.equipment.updateMany({
      where: {
        id: { in: equipmentIds }
      },
      data: {
        status: EquipmentStatus.REMOVED,
        metadata: {
          removedAt: new Date(),
          removedBy: (req as any).user.id
        }
      }
    });

    res.json({
      message: `${result.count} equipment items removed successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Error bulk deleting equipment:', error);
    res.status(500).json({ message: 'Error deleting equipment' });
  }
};

export const assignEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentIds, assignToId } = req.body;

    // Verify user exists and has appropriate role
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignToId,
        companyId: (req as any).user.companyId,
        role: { in: ['TECHNICIAN', 'MANAGER'] }
      }
    });

    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found or invalid role' });
    }

    // Verify all equipment belongs to user's company
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        vessel: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (equipment.length !== equipmentIds.length) {
      return res.status(403).json({ message: 'Some equipment not found or unauthorized' });
    }

    const result = await prisma.equipment.updateMany({
      where: {
        id: { in: equipmentIds }
      },
      data: {
        documentedBy: assignToId,
        metadata: {
          assignedAt: new Date(),
          assignedBy: (req as any).user.id
        }
      }
    });

    res.json({
      message: `${result.count} equipment items assigned successfully`,
      count: result.count,
      assignee: {
        id: assignee.id,
        firstName: assignee.firstName,
        lastName: assignee.lastName,
        email: assignee.email
      }
    });
  } catch (error) {
    console.error('Error assigning equipment:', error);
    res.status(500).json({ message: 'Error assigning equipment' });
  }
};

export const getEquipmentStats = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.query;

    const where: any = {
      vessel: {
        companyId: (req as any).user.companyId
      }
    };

    if (vesselId) where.vesselId = vesselId;

    const [
      totalCount,
      statusCounts,
      criticalityCounts,
      assignmentCounts,
      recentActivity
    ] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.equipment.groupBy({
        by: ['criticality'],
        where,
        _count: true
      }),
      prisma.equipment.groupBy({
        by: ['documentedBy'],
        where: {
          ...where,
          documentedBy: { not: null }
        },
        _count: true
      }),
      prisma.equipment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          vessel: true,
          documentedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    // Get assignee details
    const assigneeIds = assignmentCounts.map(a => a.documentedBy).filter(Boolean);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const assigneeMap = assignees.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as any);

    res.json({
      total: totalCount,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as any),
      byCriticality: criticalityCounts.reduce((acc, item) => {
        acc[item.criticality] = item._count;
        return acc;
      }, {} as any),
      byAssignee: assignmentCounts.map(item => ({
        user: assigneeMap[item.documentedBy!],
        count: item._count
      })),
      recentActivity
    });
  } catch (error) {
    console.error('Error getting equipment stats:', error);
    res.status(500).json({ message: 'Error fetching equipment statistics' });
  }
};