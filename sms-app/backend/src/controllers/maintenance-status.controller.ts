import { Request, Response } from 'express';
import { dbAll, dbRun, dbGet } from '../config/database.abstraction';

// Check if user has completed maintenance status entry
export const checkMaintenanceStatusComplete = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await dbGet(
      'SELECT maintenance_status_complete, is_first_login FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      isComplete: user?.maintenance_status_complete || false,
      isFirstLogin: user?.is_first_login || false
    });
    
  } catch (error) {
    console.error('Failed to check maintenance status:', error);
    res.status(500).json({ error: 'Failed to check maintenance status' });
  }
};

// Bulk update equipment maintenance status
export const bulkUpdateMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { updates, markComplete } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid updates array' });
    }
    
    // Start transaction
    await dbRun('BEGIN');
    
    try {
      // Update each equipment's maintenance status
      for (const update of updates) {
        const { equipmentId, lastMaintenanceDate, currentHours, nextMaintenanceDate, notes } = update;
        
        // Update equipment record
        await dbRun(`
          UPDATE equipment 
          SET 
            last_maintenance_date = ?,
            next_maintenance_date = ?,
            running_hours = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [lastMaintenanceDate, nextMaintenanceDate, currentHours, equipmentId]);
        
        // Create maintenance log entry
        await dbRun(`
          INSERT INTO maintenance_logs (
            equipment_id, 
            performed_by, 
            maintenance_type, 
            description, 
            performed_date, 
            next_maintenance_date,
            hours_spent,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          equipmentId,
          userId,
          'routine',
          'Initial maintenance status entry',
          lastMaintenanceDate,
          nextMaintenanceDate,
          0,
          notes || 'Status entered during first login'
        ]);
      }
      
      // Mark user as having completed maintenance status entry
      if (markComplete) {
        await dbRun(`
          UPDATE users 
          SET 
            maintenance_status_complete = TRUE,
            maintenance_status_completed_at = CURRENT_TIMESTAMP,
            is_first_login = FALSE
          WHERE id = ?
        `, [userId]);
      }
      
      // Commit transaction
      await dbRun('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Maintenance status updated successfully',
        updatedCount: updates.length
      });
      
    } catch (error) {
      // Rollback on error
      await dbRun('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to update maintenance status:', error);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
};

// Get equipment that needs status entry
export const getEquipmentNeedingStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const vesselId = req.user?.vesselId;
    
    if (!userId || !vesselId) {
      return res.status(401).json({ error: 'Unauthorized or no vessel assigned' });
    }
    
    // Get equipment that either has no maintenance date or was synced recently
    const equipment = await dbAll(`
      SELECT 
        e.id,
        e.name,
        e.model,
        e.serial_number,
        e.location,
        e.maintenance_interval_days,
        e.last_maintenance_date,
        e.next_maintenance_date,
        e.running_hours,
        e.criticality
      FROM equipment e
      WHERE e.vessel_id = ?
        AND e.status = 'operational'
        AND (
          e.last_maintenance_date IS NULL 
          OR datetime(e.created_at) > datetime('now', '-7 days')
        )
      ORDER BY 
        CASE e.criticality 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        e.name ASC
    `, [vesselId]);
    
    res.json(equipment);
    
  } catch (error) {
    console.error('Failed to get equipment needing status:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};