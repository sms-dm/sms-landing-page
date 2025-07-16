import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock data store - replace with actual database operations
const vessels = new Map();

export const listVessels = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sort = 'createdAt:desc',
      companyId,
      status,
      onboardingStatus 
    } = req.query;

    // Get all vessels and convert to array
    let vesselList = Array.from(vessels.values());

    // Filter by companyId if provided
    if (companyId) {
      vesselList = vesselList.filter(v => v.companyId === companyId);
    }

    // Filter by status if provided
    if (status) {
      vesselList = vesselList.filter(v => v.status === status);
    }

    // Filter by onboarding status if provided
    if (onboardingStatus) {
      vesselList = vesselList.filter(v => v.onboardingStatus === onboardingStatus);
    }

    // Search filter
    if (search) {
      const searchLower = search.toString().toLowerCase();
      vesselList = vesselList.filter(v => 
        v.name.toLowerCase().includes(searchLower) ||
        v.imoNumber.includes(searchLower) ||
        v.vesselType.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const [sortField, sortOrder] = sort.toString().split(':');
    vesselList.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedVessels = vesselList.slice(startIndex, endIndex);

    res.json({
      data: paginatedVessels,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(vesselList.length / limitNum),
        totalItems: vesselList.length
      }
    });
  } catch (error) {
    console.error('Error listing vessels:', error);
    res.status(500).json({ message: 'Error fetching vessels' });
  }
};

export const createVessel = async (req: Request, res: Response) => {
  try {
    const vesselData = req.body;
    
    // Check if vessel with same IMO already exists
    const existingVessel = Array.from(vessels.values()).find(
      v => v.imoNumber === vesselData.imoNumber
    );
    
    if (existingVessel) {
      return res.status(400).json({ message: 'Vessel with this IMO number already exists' });
    }

    const newVessel = {
      id: uuidv4(),
      ...vesselData,
      status: 'active',
      onboardingStatus: 'not_started',
      onboardingProgress: 0,
      engineDetails: {
        mainEngine: vesselData.mainEngine || {},
        auxiliaryEngines: vesselData.auxiliaryEngines || []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: (req as any).user?.id
    };

    vessels.set(newVessel.id, newVessel);

    res.status(201).json({
      data: newVessel,
      message: 'Vessel created successfully'
    });
  } catch (error) {
    console.error('Error creating vessel:', error);
    res.status(500).json({ message: 'Error creating vessel' });
  }
};

export const getVessel = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const vessel = vessels.get(vesselId);

    if (!vessel) {
      return res.status(404).json({ message: 'Vessel not found' });
    }

    res.json({ data: vessel });
  } catch (error) {
    console.error('Error fetching vessel:', error);
    res.status(500).json({ message: 'Error fetching vessel' });
  }
};

export const updateVessel = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const updates = req.body;
    
    const vessel = vessels.get(vesselId);
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel not found' });
    }

    // Update vessel data
    const updatedVessel = {
      ...vessel,
      ...updates,
      updatedAt: new Date(),
      updatedBy: (req as any).user?.id
    };

    // Preserve certain fields that shouldn't be updated
    updatedVessel.id = vessel.id;
    updatedVessel.companyId = vessel.companyId;
    updatedVessel.imoNumber = vessel.imoNumber;
    updatedVessel.createdAt = vessel.createdAt;
    updatedVessel.createdBy = vessel.createdBy;

    vessels.set(vesselId, updatedVessel);

    res.json({
      data: updatedVessel,
      message: 'Vessel updated successfully'
    });
  } catch (error) {
    console.error('Error updating vessel:', error);
    res.status(500).json({ message: 'Error updating vessel' });
  }
};

export const deleteVessel = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    
    if (!vessels.has(vesselId)) {
      return res.status(404).json({ message: 'Vessel not found' });
    }

    vessels.delete(vesselId);

    res.json({ message: 'Vessel deleted successfully' });
  } catch (error) {
    console.error('Error deleting vessel:', error);
    res.status(500).json({ message: 'Error deleting vessel' });
  }
};

export const getOnboardingProgress = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const vessel = vessels.get(vesselId);

    if (!vessel) {
      return res.status(404).json({ message: 'Vessel not found' });
    }

    // Mock onboarding progress data
    const progress = {
      vesselId,
      overallProgress: vessel.onboardingProgress || 0,
      status: vessel.onboardingStatus || 'not_started',
      categories: [
        {
          name: 'Main Engine',
          progress: 75,
          itemsCompleted: 15,
          totalItems: 20
        },
        {
          name: 'Auxiliary Engines',
          progress: 50,
          itemsCompleted: 10,
          totalItems: 20
        },
        {
          name: 'Safety Equipment',
          progress: 100,
          itemsCompleted: 30,
          totalItems: 30
        },
        {
          name: 'Navigation',
          progress: 25,
          itemsCompleted: 5,
          totalItems: 20
        }
      ],
      lastUpdated: vessel.updatedAt || new Date(),
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    res.json({ data: progress });
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    res.status(500).json({ message: 'Error fetching onboarding progress' });
  }
};