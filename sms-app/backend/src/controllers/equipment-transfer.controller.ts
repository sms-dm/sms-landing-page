import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database.abstraction';

interface TransferRequest {
  equipmentId: number;
  toVesselId: number;
  toLocation?: string;
  reason: string;
  notes?: string;
}

// Transfer equipment between vessels (only for TEMPORARY or RENTAL equipment)
export const transferEquipment = async (req: Request, res: Response): Promise<Response> => {
  await dbRun('BEGIN TRANSACTION');
  
  try {
    const { equipmentId, toVesselId, toLocation, reason, notes } = req.body as TransferRequest;
    const userId = (req as any).user.id;
    
    // Validate input
    if (!equipmentId || !toVesselId || !reason) {
      await dbRun('ROLLBACK');
      return res.status(400).json({ 
        error: 'Missing required fields: equipmentId, toVesselId, reason' 
      });
    }
    
    // Get equipment details
    const equipment = await dbGet(
      `SELECT e.*, v.id as vessel_id, v.name as vessel_name 
       FROM equipment e
       JOIN vessels v ON e.vessel_id = v.id
       WHERE e.id = ?`,
      [equipmentId]
    );
    
    if (!equipment) {
      await dbRun('ROLLBACK');
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Check if equipment can be transferred (only TEMPORARY or RENTAL)
    if (equipment.classification === 'PERMANENT') {
      await dbRun('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot transfer permanent equipment. Only temporary or rental equipment can be transferred.' 
      });
    }
    
    // Check if destination vessel exists
    const destinationVessel = await dbGet(
      'SELECT id, name FROM vessels WHERE id = ?',
      [toVesselId]
    );
    
    if (!destinationVessel) {
      await dbRun('ROLLBACK');
      return res.status(404).json({ error: 'Destination vessel not found' });
    }
    
    // Check if equipment is already at the destination vessel
    if (equipment.vessel_id === toVesselId) {
      await dbRun('ROLLBACK');
      return res.status(400).json({ 
        error: 'Equipment is already assigned to this vessel' 
      });
    }
    
    // Create transfer record
    await dbRun(
      `INSERT INTO equipment_transfers (
        equipment_id, from_vessel_id, to_vessel_id, 
        from_location, to_location, transfer_reason, 
        transfer_notes, transferred_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        equipmentId,
        equipment.vessel_id,
        toVesselId,
        equipment.location,
        toLocation || 'To be assigned',
        reason,
        notes || null,
        userId,
        'completed'
      ]
    );
    
    // Update equipment's current vessel and location
    await dbRun(
      `UPDATE equipment 
       SET vessel_id = ?, location = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [toVesselId, toLocation || 'To be assigned', equipmentId]
    );
    
    // Commit transaction
    await dbRun('COMMIT');
    
    // Get the created transfer record
    const transfer = await dbGet(
      `SELECT t.*, 
        e.name as equipment_name, e.qr_code,
        fv.name as from_vessel_name,
        tv.name as to_vessel_name,
        u.first_name || ' ' || u.last_name as transferred_by_name
       FROM equipment_transfers t
       JOIN equipment e ON t.equipment_id = e.id
       JOIN vessels fv ON t.from_vessel_id = fv.id
       JOIN vessels tv ON t.to_vessel_id = tv.id
       JOIN users u ON t.transferred_by = u.id
       WHERE t.equipment_id = ? 
       ORDER BY t.id DESC 
       LIMIT 1`,
      [equipmentId]
    );
    
    res.json({
      success: true,
      message: 'Equipment transferred successfully',
      transfer
    });
    
  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('Transfer error:', error);
    res.status(500).json({ 
      error: 'Failed to transfer equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get transfer history for equipment
export const getEquipmentTransferHistory = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    
    const transfers = await dbAll(
      `SELECT t.*, 
        fv.name as from_vessel_name,
        tv.name as to_vessel_name,
        u.first_name || ' ' || u.last_name as transferred_by_name
       FROM equipment_transfers t
       JOIN vessels fv ON t.from_vessel_id = fv.id
       JOIN vessels tv ON t.to_vessel_id = tv.id
       JOIN users u ON t.transferred_by = u.id
       WHERE t.equipment_id = ?
       ORDER BY t.transfer_date DESC`,
      [equipmentId]
    );
    
    res.json({
      success: true,
      transfers
    });
    
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transfer history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all transfers for a vessel
export const getVesselTransfers = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const { type = 'all' } = req.query; // 'all', 'incoming', 'outgoing'
    
    let query = `
      SELECT t.*, 
        e.name as equipment_name, e.qr_code, e.classification,
        fv.name as from_vessel_name,
        tv.name as to_vessel_name,
        u.first_name || ' ' || u.last_name as transferred_by_name
       FROM equipment_transfers t
       JOIN equipment e ON t.equipment_id = e.id
       JOIN vessels fv ON t.from_vessel_id = fv.id
       JOIN vessels tv ON t.to_vessel_id = tv.id
       JOIN users u ON t.transferred_by = u.id
    `;
    
    const params: any[] = [];
    
    if (type === 'incoming') {
      query += ' WHERE t.to_vessel_id = ?';
      params.push(vesselId);
    } else if (type === 'outgoing') {
      query += ' WHERE t.from_vessel_id = ?';
      params.push(vesselId);
    } else {
      query += ' WHERE t.from_vessel_id = ? OR t.to_vessel_id = ?';
      params.push(vesselId, vesselId);
    }
    
    query += ' ORDER BY t.transfer_date DESC';
    
    const transfers = await dbAll(query, params);
    
    res.json({
      success: true,
      transfers
    });
    
  } catch (error) {
    console.error('Error fetching vessel transfers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vessel transfers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get transferable equipment (TEMPORARY or RENTAL only)
export const getTransferableEquipment = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    
    const equipment = await dbAll(
      `SELECT e.*, v.name as vessel_name
       FROM equipment e
       JOIN vessels v ON e.vessel_id = v.id
       WHERE e.vessel_id = ? 
         AND e.classification IN ('TEMPORARY', 'RENTAL')
         AND e.status = 'operational'
       ORDER BY e.name`,
      [vesselId]
    );
    
    res.json({
      success: true,
      equipment
    });
    
  } catch (error) {
    console.error('Error fetching transferable equipment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transferable equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Cancel a pending transfer
export const cancelTransfer = async (req: Request, res: Response): Promise<Response> => {
  await dbRun('BEGIN TRANSACTION');
  
  try {
    const { transferId } = req.params;
    const _userId = (req as any).user.id;
    
    // Get transfer details
    const transfer = await dbGet(
      'SELECT * FROM equipment_transfers WHERE id = ? AND status = ?',
      [transferId, 'pending']
    );
    
    if (!transfer) {
      await dbRun('ROLLBACK');
      return res.status(404).json({ 
        error: 'Pending transfer not found' 
      });
    }
    
    // Update transfer status
    await dbRun(
      `UPDATE equipment_transfers 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [transferId]
    );
    
    // If equipment was already moved, move it back
    if (transfer.status === 'in_transit') {
      await dbRun(
        `UPDATE equipment 
         SET vessel_id = ?, location = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [transfer.from_vessel_id, transfer.from_location, transfer.equipment_id]
      );
    }
    
    await dbRun('COMMIT');
    
    res.json({
      success: true,
      message: 'Transfer cancelled successfully'
    });
    
  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('Cancel transfer error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel transfer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};