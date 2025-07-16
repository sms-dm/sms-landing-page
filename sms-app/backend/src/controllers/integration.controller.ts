import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database.abstraction';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Interface matching the onboarding portal export format
interface OnboardingExportData {
  vessel: {
    id: string;
    name: string;
    imo: string;
    type: string;
    flag: string;
    company: {
      id: string;
      name: string;
      code: string;
    };
    specifications: any;
    locations: any[];
  };
  equipment: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    criticality: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
    location: any;
    maintenanceSchedule: {
      intervalDays: number;
      lastMaintenance: string | null;
      nextMaintenance: string | null;
    };
    specifications: any;
    qualityScore: number;
    approvalDetails: {
      documentedBy: string | null;
      documentedAt: string | null;
      reviewedBy: string | null;
      reviewedAt: string | null;
      approvedBy: string | null;
      approvedAt: string | null;
    };
    metadata: any;
  }>;
  parts: Array<{
    id: string;
    equipmentId: string;
    equipmentName: string;
    name: string;
    partNumber: string | null;
    manufacturer: string | null;
    description: string | null;
    criticality: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
    quantity: number;
    unitOfMeasure: string | null;
    minimumStock: number;
    currentStock: number;
    specifications: any;
    metadata: any;
  }>;
  documents: Array<{
    id: string;
    equipmentId: string;
    equipmentName: string;
    type: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    metadata: any;
  }>;
  metadata: {
    exportId: string;
    exportDate: string;
    exportedBy: string;
    format: string;
    includePhotos: boolean;
  };
}

// Map onboarding status to maintenance portal status
const mapEquipmentStatus = (onboardingStatus: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'operational',
    'APPROVED': 'operational',
    'VERIFIED': 'operational',
    'REMOVED': 'decommissioned',
    'DELETED': 'decommissioned',
    'REJECTED': 'decommissioned'
  };
  return statusMap[onboardingStatus] || 'operational';
};

// Map classification if needed (in case old data has TEMPORARY)
const mapClassification = (classification: string): string => {
  return classification === 'TEMPORARY' ? 'TEMPORARY' : classification;
};

// Map onboarding role to maintenance portal role
const mapUserRole = (onboardingRole: string): string => {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'admin',
    'ADMIN': 'admin',
    'MANAGER': 'manager',
    'TECHNICIAN': 'technician',
    'HSE_OFFICER': 'technician', // HSE officers are technicians in maintenance portal
    'VIEWER': 'technician'
  };
  return roleMap[onboardingRole] || 'technician';
};

// Generate equipment QR code if not provided
const generateQRCode = (equipmentName: string, index: number): string => {
  const prefix = 'SMS';
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}-${index.toString().padStart(3, '0')}`;
};

// Import vessel and related data from onboarding portal
export const importFromOnboarding = async (req: Request, res: Response) => {
  const transaction = await dbRun('BEGIN TRANSACTION');
  
  try {
    const importData: OnboardingExportData = req.body;
    
    if (!importData || !importData.vessel) {
      await dbRun('ROLLBACK');
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    // Log import attempt
    console.log(`Starting import for vessel: ${importData.vessel.name} (${importData.vessel.imo})`);

    // 1. Check if company exists, create if not
    let company = await dbGet(
      'SELECT id FROM companies WHERE name = ?',
      [importData.vessel.company.name]
    );

    if (!company) {
      const slug = importData.vessel.company.name.toLowerCase().replace(/\s+/g, '-');
      await dbRun(
        `INSERT INTO companies (name, slug) VALUES (?, ?)`,
        [importData.vessel.company.name, slug]
      );
      company = await dbGet('SELECT id FROM companies WHERE slug = ?', [slug]);
    }

    // 2. Check if vessel exists, create or update
    let vessel = await dbGet(
      'SELECT id FROM vessels WHERE imo_number = ?',
      [importData.vessel.imo]
    );

    if (!vessel) {
      await dbRun(
        `INSERT INTO vessels (company_id, name, imo_number, vessel_type, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [company.id, importData.vessel.name, importData.vessel.imo, 
         importData.vessel.type || 'General Cargo', 'operational']
      );
      vessel = await dbGet('SELECT id FROM vessels WHERE imo_number = ?', [importData.vessel.imo]);
    } else {
      // Update vessel information
      await dbRun(
        `UPDATE vessels SET name = ?, vessel_type = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [importData.vessel.name, importData.vessel.type || 'General Cargo', vessel.id]
      );
    }

    // 3. Import equipment
    const equipmentMapping: Record<string, number> = {};
    let equipmentIndex = 0;

    for (const equipment of importData.equipment) {
      equipmentIndex++;
      
      // Generate QR code if not provided
      const qrCode = equipment.code || generateQRCode(equipment.name, equipmentIndex);
      
      // Extract location string from location object
      const locationString = typeof equipment.location === 'object' 
        ? equipment.location?.name || 'Unknown Location'
        : equipment.location || 'Unknown Location';

      // Check if equipment with this QR code exists
      const existingEquipment = await dbGet(
        'SELECT id FROM equipment WHERE qr_code = ?',
        [qrCode]
      );

      if (existingEquipment) {
        // Update existing equipment
        await dbRun(
          `UPDATE equipment SET 
           name = ?, manufacturer = ?, model = ?, serial_number = ?,
           location = ?, equipment_type = ?, status = ?, criticality = ?,
           last_maintenance_date = ?, next_maintenance_date = ?,
           specifications = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            equipment.name,
            equipment.manufacturer || null,
            equipment.model || null,
            equipment.serialNumber || null,
            locationString,
            equipment.type || 'general',
            'operational', // Always set to operational on import
            equipment.criticality || 'STANDARD',
            equipment.maintenanceSchedule?.lastMaintenance || null,
            equipment.maintenanceSchedule?.nextMaintenance || null,
            JSON.stringify(equipment.specifications || {}),
            existingEquipment.id
          ]
        );
        equipmentMapping[equipment.id] = existingEquipment.id;
      } else {
        // Insert new equipment
        await dbRun(
          `INSERT INTO equipment (
            vessel_id, qr_code, name, manufacturer, model, serial_number,
            location, equipment_type, status, criticality, classification,
            installation_date, last_maintenance_date, next_maintenance_date, specifications
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            vessel.id,
            qrCode,
            equipment.name,
            equipment.manufacturer || null,
            equipment.model || null,
            equipment.serialNumber || null,
            locationString,
            equipment.type || 'general',
            'operational',
            equipment.criticality || 'STANDARD',
            'PERMANENT', // Default to PERMANENT, can be updated later
            equipment.approvalDetails?.documentedAt 
              ? new Date(equipment.approvalDetails.documentedAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            equipment.maintenanceSchedule?.lastMaintenance || null,
            equipment.maintenanceSchedule?.nextMaintenance || null,
            JSON.stringify(equipment.specifications || {})
          ]
        );
        
        const newEquipment = await dbGet(
          'SELECT id FROM equipment WHERE qr_code = ?',
          [qrCode]
        );
        equipmentMapping[equipment.id] = newEquipment.id;
      }
    }

    // 4. Import parts (store in equipment specifications for now)
    // Note: The maintenance portal doesn't have a separate parts table for equipment
    // We'll store critical parts info in the equipment specifications
    for (const part of importData.parts) {
      const equipmentId = equipmentMapping[part.equipmentId];
      if (equipmentId) {
        const equipment = await dbGet(
          'SELECT specifications FROM equipment WHERE id = ?',
          [equipmentId]
        );
        
        const specs = JSON.parse(equipment.specifications || '{}');
        if (!specs.criticalParts) {
          specs.criticalParts = [];
        }
        
        specs.criticalParts.push({
          name: part.name,
          partNumber: part.partNumber,
          manufacturer: part.manufacturer,
          description: part.description,
          criticality: part.criticality,
          quantity: part.quantity,
          unitOfMeasure: part.unitOfMeasure,
          minimumStock: part.minimumStock,
          currentStock: part.currentStock
        });
        
        await dbRun(
          'UPDATE equipment SET specifications = ? WHERE id = ?',
          [JSON.stringify(specs), equipmentId]
        );
      }
    }

    // 5. Import documents (if photos included)
    // Note: Document import would require file transfer which is not implemented here
    // This would need a separate file upload mechanism
    let documentsImported = 0;
    if (importData.metadata.includePhotos && importData.documents.length > 0) {
      // Log document info but don't import actual files
      console.log(`Skipping ${importData.documents.length} documents - file transfer not implemented`);
      documentsImported = 0;
    }

    // Commit transaction
    await dbRun('COMMIT');

    // Return success response
    res.json({
      success: true,
      message: 'Import completed successfully',
      data: {
        importId: importData.metadata.exportId,
        company: {
          id: company.id,
          name: importData.vessel.company.name
        },
        vessel: {
          id: vessel.id,
          name: importData.vessel.name,
          imo: importData.vessel.imo
        },
        imported: {
          equipment: importData.equipment.length,
          parts: importData.parts.length,
          documents: documentsImported
        }
      }
    });

  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Import users from onboarding portal
export const importUsers = async (req: Request, res: Response) => {
  const transaction = await dbRun('BEGIN TRANSACTION');
  
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      await dbRun('ROLLBACK');
      return res.status(400).json({ error: 'Invalid users data format' });
    }

    const importResults = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const user of users) {
      try {
        // Check if company exists
        let company = await dbGet(
          'SELECT id FROM companies WHERE name = ?',
          [user.company.name]
        );

        if (!company) {
          // Create company if it doesn't exist
          const slug = user.company.name.toLowerCase().replace(/\s+/g, '-');
          await dbRun(
            `INSERT INTO companies (name, slug) VALUES (?, ?)`,
            [user.company.name, slug]
          );
          company = await dbGet('SELECT id FROM companies WHERE slug = ?', [slug]);
        }

        // Check if user exists
        const existingUser = await dbGet(
          'SELECT id FROM users WHERE email = ?',
          [user.email]
        );

        const mappedRole = mapUserRole(user.role);

        if (existingUser) {
          // Update existing user
          await dbRun(
            `UPDATE users SET 
             first_name = ?, last_name = ?, role = ?, 
             company_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [user.firstName, user.lastName, mappedRole, company.id, existingUser.id]
          );
          importResults.updated++;
        } else {
          // Create new user with temporary password
          const tempPassword = `Temp${Date.now().toString().slice(-6)}!`;
          const passwordHash = await bcrypt.hash(tempPassword, 10);
          
          await dbRun(
            `INSERT INTO users (
              company_id, email, password_hash, first_name, last_name, role
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [company.id, user.email, passwordHash, user.firstName, user.lastName, mappedRole]
          );
          importResults.created++;
        }
      } catch (userError) {
        importResults.failed++;
        importResults.errors.push(`Failed to import user ${user.email}: ${userError}`);
      }
    }

    await dbRun('COMMIT');

    res.json({
      success: true,
      message: 'User import completed',
      results: importResults
    });

  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('User import error:', error);
    res.status(500).json({ 
      error: 'Failed to import users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get import status (for future webhook implementation)
export const getImportStatus = async (req: Request, res: Response) => {
  try {
    const { importId } = req.params;
    
    // For now, just return a mock status
    // In production, this would query an import tracking table
    res.json({
      importId,
      status: 'completed',
      message: 'Import completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get import status' });
  }
};