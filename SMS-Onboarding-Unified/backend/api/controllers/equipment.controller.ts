import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentClassification } from '../../types/entities';
import { prisma } from '../../services/prisma';

export const listEquipmentByVessel = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sort = 'createdAt:desc',
      type,
      status,
      criticalLevel,
      location,
      classification
    } = req.query;

    const where: any = { vesselId };

    // Apply filters
    if (type) where.equipmentType = type;
    if (status) where.status = status;
    if (criticalLevel) where.criticality = criticalLevel;
    if (classification) where.classification = classification;
    if (location) where.locationId = location;

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Sort
    const [sortField, sortOrder] = (sort as string).split(':');
    const orderBy = { [sortField]: sortOrder };

    // Get total count
    const totalItems = await prisma.equipment.count({ where });

    // Get paginated data
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    const equipmentList = await prisma.equipment.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        location: true,
        documentedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        reviewedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        approvedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: {
          select: {
            criticalParts: true,
            documents: true,
            transfers: true
          }
        }
      }
    });

    res.json({
      data: equipmentList,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems
      }
    });
  } catch (error) {
    console.error('Error listing equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment' });
  }
};

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        vessel: true,
        location: true,
        documentedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        reviewedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        approvedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        criticalParts: true,
        documents: true,
        qualityScores: {
          include: {
            evaluatedByUser: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        transfers: {
          include: {
            fromVessel: true,
            toVessel: true,
            fromLocation: true,
            toLocation: true,
            transferredByUser: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { transferredAt: 'desc' }
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json({ data: equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment' });
  }
};

export const createEquipment = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const equipmentData = req.body;
    const user = (req as any).user;

    const newEquipment = await prisma.equipment.create({
      data: {
        vesselId,
        ...equipmentData,
        classification: equipmentData.classification || EquipmentClassification.PERMANENT,
        status: equipmentData.status || 'DRAFT',
        documentedBy: user?.id,
        documentedAt: new Date()
      },
      include: {
        location: true,
        documentedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        entityType: 'equipment',
        entityId: newEquipment.id,
        action: 'CREATE',
        newValues: newEquipment,
        metadata: { vesselId }
      }
    });

    res.status(201).json({
      data: newEquipment,
      message: 'Equipment created successfully'
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment' });
  }
};

export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const updateData = req.body;
    const user = (req as any).user;

    // Get current equipment for audit log
    const currentEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!currentEquipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: updateData,
      include: {
        location: true,
        documentedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        reviewedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        approvedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        entityType: 'equipment',
        entityId: equipmentId,
        action: 'UPDATE',
        oldValues: currentEquipment,
        newValues: updatedEquipment,
        metadata: { changes: Object.keys(updateData) }
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

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const user = (req as any).user;

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Soft delete by updating status
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'DELETED' }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        entityType: 'equipment',
        entityId: equipmentId,
        action: 'DELETE',
        oldValues: equipment,
        metadata: { softDelete: true }
      }
    });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Error deleting equipment' });
  }
};

export const verifyEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const { qualityScore, notes } = req.body;
    const user = (req as any).user;

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Update equipment status and quality score
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: 'REVIEWED',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        qualityScore,
        notes: notes || equipment.notes
      }
    });

    // Create quality score record
    await prisma.qualityScore.create({
      data: {
        equipmentId,
        metric: 'COMPLETENESS',
        score: qualityScore,
        evaluatedBy: user.id,
        details: { notes, verificationTime: new Date() }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        entityType: 'equipment',
        entityId: equipmentId,
        action: 'VERIFY',
        newValues: { qualityScore, notes },
        metadata: { previousStatus: equipment.status }
      }
    });

    res.json({
      data: updatedEquipment,
      message: 'Equipment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying equipment:', error);
    res.status(500).json({ message: 'Error verifying equipment' });
  }
};

export const transferEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const { 
      toVesselId, 
      toLocationId, 
      reason, 
      notes 
    } = req.body;
    const user = (req as any).user;

    // Get current equipment with all related data
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        criticalParts: true,
        documents: true,
        qualityScores: true
      }
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Verify equipment is classified as FLOATING or RENTAL
    if (equipment.classification === EquipmentClassification.PERMANENT) {
      return res.status(400).json({ 
        message: 'Only floating or rental equipment can be transferred' 
      });
    }

    // Verify destination vessel exists
    const toVessel = await prisma.vessel.findUnique({
      where: { id: toVesselId }
    });

    if (!toVessel) {
      return res.status(404).json({ message: 'Destination vessel not found' });
    }

    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer record with snapshots of current data
      const transfer = await tx.equipmentTransfer.create({
        data: {
          equipmentId,
          fromVesselId: equipment.vesselId,
          toVesselId,
          fromLocationId: equipment.locationId,
          toLocationId,
          transferredBy: user.id,
          transferredAt: new Date(),
          reason,
          notes,
          documentData: equipment.documents,
          partsData: equipment.criticalParts,
          qualityScoresData: equipment.qualityScores,
          metadata: {
            equipmentSnapshot: {
              name: equipment.name,
              manufacturer: equipment.manufacturer,
              model: equipment.model,
              serialNumber: equipment.serialNumber,
              specifications: equipment.specifications
            }
          }
        }
      });

      // Update equipment with new vessel and location
      const updatedEquipment = await tx.equipment.update({
        where: { id: equipmentId },
        data: {
          vesselId: toVesselId,
          locationId: toLocationId
        },
        include: {
          vessel: true,
          location: true
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          entityType: 'equipment',
          entityId: equipmentId,
          action: 'TRANSFER',
          oldValues: {
            vesselId: equipment.vesselId,
            locationId: equipment.locationId
          },
          newValues: {
            vesselId: toVesselId,
            locationId: toLocationId
          },
          metadata: {
            transferId: transfer.id,
            reason,
            notes
          }
        }
      });

      // Create notification for vessel managers
      const managers = await tx.user.findMany({
        where: {
          companyId: user.companyId,
          role: { in: ['MANAGER', 'ADMIN'] }
        }
      });

      const notifications = managers.map(manager => ({
        userId: manager.id,
        type: 'EQUIPMENT_TRANSFER',
        title: 'Equipment Transferred',
        message: `${equipment.name} has been transferred from vessel ${equipment.vesselId} to ${toVesselId}`,
        data: {
          equipmentId,
          transferId: transfer.id,
          fromVesselId: equipment.vesselId,
          toVesselId
        }
      }));

      await tx.notification.createMany({ data: notifications });

      return { equipment: updatedEquipment, transfer };
    });

    res.json({
      data: result,
      message: 'Equipment transferred successfully'
    });
  } catch (error) {
    console.error('Error transferring equipment:', error);
    res.status(500).json({ message: 'Error transferring equipment' });
  }
};

export const getEquipmentTransferHistory = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    const where = { equipmentId };

    const totalItems = await prisma.equipmentTransfer.count({ where });

    const transfers = await prisma.equipmentTransfer.findMany({
      where,
      orderBy: { transferredAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        fromVessel: true,
        toVessel: true,
        fromLocation: true,
        toLocation: true,
        transferredByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({
      data: transfers,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    res.status(500).json({ message: 'Error fetching transfer history' });
  }
};