import { Request, Response } from 'express';
import { prisma } from '../../services/prisma';
import { logger } from '../../services/logger.service';
import bcrypt from 'bcryptjs';
import { config } from '../../config';
import { UserRole } from '@prisma/client';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
  };
}

// List all companies (admin only)
export const listCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, sort = 'createdAt:desc' } = req.query;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { contactEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Sort
    const [sortField, sortOrder] = (sort as string).split(':');
    const orderBy = { [sortField]: sortOrder };

    // Get total count
    const totalItems = await prisma.company.count({ where });

    // Get paginated data
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    const companies = await prisma.company.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: {
            users: true,
            vessels: true,
          },
        },
      },
    });

    res.json({
      data: companies,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
      },
    });
  } catch (error) {
    logger.error('Error listing companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

// Create a new company
export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      registrationNumber,
      address,
      contact,
      logoUrl,
    } = req.body;
    const user = req.user;

    // Generate unique company code
    const code = generateCompanyCode(name);

    // Check if code already exists
    const existingCompany = await prisma.company.findUnique({
      where: { code },
    });

    if (existingCompany) {
      return res.status(400).json({ message: 'Company code already exists' });
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        code,
        address: address ? JSON.stringify(address) : null,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        settings: {
          registrationNumber,
          website: contact.website,
          logoUrl,
        },
      },
    });

    // Create admin user for the company if requested
    if (req.body.createAdminUser) {
      const { adminEmail, adminFirstName, adminLastName, adminPassword } = req.body;

      const passwordHash = await bcrypt.hash(adminPassword, config.auth.bcryptRounds);

      await prisma.user.create({
        data: {
          companyId: company.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: UserRole.ADMIN,
        },
      });

      logger.info(`Admin user created for company ${company.id}`);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user?.id,
        entityType: 'company',
        entityId: company.id,
        action: 'CREATE',
        newValues: company,
        metadata: { createdBy: user?.id },
      },
    });

    logger.info(`Company created: ${company.id}`);

    res.status(201).json({
      data: company,
      message: 'Company created successfully',
    });
  } catch (error) {
    logger.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
};

// Get company details
export const getCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const user = req.user;

    // Check access - users can only access their own company unless admin
    if (user?.role !== 'ADMIN' && user?.companyId !== companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            vessels: true,
          },
        },
        vessels: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
            onboardingStatus: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        users: {
          where: { role: UserRole.ADMIN },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
          take: 5,
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Parse address if stored as string
    if (company.address && typeof company.address === 'string') {
      try {
        company.address = JSON.parse(company.address);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    res.json({ data: company });
  } catch (error) {
    logger.error('Error fetching company:', error);
    res.status(500).json({ message: 'Error fetching company' });
  }
};

// Update company
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;
    const user = req.user;

    // Get current company for audit log
    const currentCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!currentCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Prepare update data
    const data: any = {};

    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.address !== undefined) {
      data.address = typeof updateData.address === 'object' 
        ? JSON.stringify(updateData.address) 
        : updateData.address;
    }
    if (updateData.contact?.email !== undefined) data.contactEmail = updateData.contact.email;
    if (updateData.contact?.phone !== undefined) data.contactPhone = updateData.contact.phone;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

    // Update settings
    if (updateData.registrationNumber !== undefined || 
        updateData.contact?.website !== undefined || 
        updateData.logoUrl !== undefined) {
      const currentSettings = (currentCompany.settings as any) || {};
      data.settings = {
        ...currentSettings,
        ...(updateData.registrationNumber !== undefined && { registrationNumber: updateData.registrationNumber }),
        ...(updateData.contact?.website !== undefined && { website: updateData.contact.website }),
        ...(updateData.logoUrl !== undefined && { logoUrl: updateData.logoUrl }),
      };
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: user?.id,
        entityType: 'company',
        entityId: companyId,
        action: 'UPDATE',
        oldValues: currentCompany,
        newValues: updatedCompany,
        metadata: { changes: Object.keys(data) },
      },
    });

    logger.info(`Company updated: ${companyId}`);

    res.json({
      data: updatedCompany,
      message: 'Company updated successfully',
    });
  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
};

// Delete company (soft delete)
export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const user = req.user;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            vessels: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if company has active vessels
    if (company._count.vessels > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete company with active vessels. Please remove all vessels first.' 
      });
    }

    // Soft delete by deactivating
    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });

    // Deactivate all users
    await prisma.user.updateMany({
      where: { companyId },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: user?.id,
        entityType: 'company',
        entityId: companyId,
        action: 'DELETE',
        oldValues: company,
        metadata: { softDelete: true },
      },
    });

    logger.info(`Company deactivated: ${companyId}`);

    res.json({ message: 'Company deactivated successfully' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
};

// Helper function to generate company code
function generateCompanyCode(name: string): string {
  // Take first 3 letters of each word, up to 3 words
  const words = name.split(' ').filter(word => word.length > 0);
  const code = words
    .slice(0, 3)
    .map(word => word.substring(0, 3).toUpperCase())
    .join('');
  
  // Add random number if code is too short
  if (code.length < 6) {
    return code + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
  
  return code;
}