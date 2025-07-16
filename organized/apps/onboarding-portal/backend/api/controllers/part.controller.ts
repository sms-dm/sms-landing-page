import { Request, Response } from 'express';
import { prisma } from '../../services/prisma';
import { CriticalLevel } from '../../types/entities';

// Get part by ID
export const getPart = async (req: Request, res: Response) => {
  try {
    const { partId } = req.params;

    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
      include: {
        equipment: true,
        suppliers: true,
        alternativeParts: true,
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    res.json(part);
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update part
export const updatePart = async (req: Request, res: Response) => {
  try {
    const { partId } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    // Check if part exists
    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    // Track stock changes
    if (updateData.currentStock !== undefined && updateData.currentStock !== part.currentStock) {
      await prisma.stockHistory.create({
        data: {
          partId,
          previousQuantity: part.currentStock,
          newQuantity: updateData.currentStock,
          changeReason: updateData.stockChangeReason || 'Manual update',
          changedBy: userId!,
          createdAt: new Date(),
        },
      });
    }

    // Update part
    const updated = await prisma.sparePart.update({
      where: { id: partId },
      data: {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId,
      },
      include: {
        equipment: true,
        suppliers: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete part
export const deletePart = async (req: Request, res: Response) => {
  try {
    const { partId } = req.params;

    // Check if part exists
    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    // Delete part
    await prisma.sparePart.delete({
      where: { id: partId },
    });

    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// List parts by equipment
export const listPartsByEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      category,
      criticalLevel,
      lowStock,
    } = req.query;

    // Build filter conditions
    const where: any = {
      equipmentId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { partNumber: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (criticalLevel) {
      where.criticalLevel = criticalLevel;
    }

    if (lowStock === 'true') {
      where.currentStock = {
        lte: prisma.sparePart.fields.minimumStock,
      };
    }

    // Get total count
    const total = await prisma.sparePart.count({ where });

    // Get parts with pagination
    const parts = await prisma.sparePart.findMany({
      where,
      include: {
        suppliers: true,
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: [
        { criticalLevel: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json({
      data: parts,
      pagination: {
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('Error listing parts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create part
export const createPart = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const partData = req.body;
    const userId = req.user?.id;

    // Validate equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Create part with suppliers
    const { suppliers, alternativeParts, ...data } = partData;

    const part = await prisma.sparePart.create({
      data: {
        ...data,
        equipmentId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        suppliers: {
          create: suppliers || [],
        },
        alternativeParts: {
          create: alternativeParts || [],
        },
      },
      include: {
        equipment: true,
        suppliers: true,
        alternativeParts: true,
      },
    });

    // Create initial stock history entry
    await prisma.stockHistory.create({
      data: {
        partId: part.id,
        previousQuantity: 0,
        newQuantity: part.currentStock,
        changeReason: 'Initial stock',
        changedBy: userId!,
        createdAt: new Date(),
      },
    });

    res.status(201).json(part);
  } catch (error) {
    console.error('Error creating part:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cross-reference parts
export const crossReferenceParts = async (req: Request, res: Response) => {
  try {
    const { partNumber, manufacturer, vesselId } = req.body;

    // Build search conditions
    const where: any = {
      partNumber: {
        contains: partNumber,
        mode: 'insensitive',
      },
    };

    if (manufacturer) {
      where.manufacturer = {
        contains: manufacturer,
        mode: 'insensitive',
      };
    }

    if (vesselId) {
      where.equipment = {
        vesselId,
      };
    }

    // Find matching parts
    const parts = await prisma.sparePart.findMany({
      where,
      include: {
        equipment: {
          include: {
            vessel: true,
            location: true,
          },
        },
        alternativeParts: true,
      },
      take: 50,
    });

    // Group by vessel and equipment
    const grouped = parts.reduce((acc: any, part) => {
      const vesselId = part.equipment.vesselId;
      if (!acc[vesselId]) {
        acc[vesselId] = {
          vessel: part.equipment.vessel,
          equipment: [],
        };
      }
      
      const existing = acc[vesselId].equipment.find(
        (e: any) => e.id === part.equipment.id
      );
      
      if (existing) {
        existing.parts.push(part);
      } else {
        acc[vesselId].equipment.push({
          ...part.equipment,
          parts: [part],
        });
      }
      
      return acc;
    }, {});

    res.json({
      totalMatches: parts.length,
      results: Object.values(grouped),
    });
  } catch (error) {
    console.error('Error cross-referencing parts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark part as critical
export const markPartAsCritical = async (req: Request, res: Response) => {
  try {
    const { partId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    // Update part criticality
    const updated = await prisma.sparePart.update({
      where: { id: partId },
      data: {
        criticalLevel: CriticalLevel.CRITICAL,
        criticalReason: reason,
        updatedAt: new Date(),
        updatedBy: userId,
      },
      include: {
        equipment: true,
      },
    });

    // Log the criticality change
    await prisma.criticalityLog.create({
      data: {
        partId,
        previousLevel: part.criticalLevel,
        newLevel: CriticalLevel.CRITICAL,
        reason,
        changedBy: userId!,
        createdAt: new Date(),
      },
    });

    // Update equipment quality score
    const { calculateQualityScore } = await import('../../services/quality.service');
    const qualityScore = await calculateQualityScore(part.equipmentId);
    await prisma.equipment.update({
      where: { id: part.equipmentId },
      data: { qualityScore },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking part as critical:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};