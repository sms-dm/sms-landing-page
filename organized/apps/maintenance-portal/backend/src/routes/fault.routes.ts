import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../config/database';

const router = Router();

// Create a new fault report
router.post('/', async (req, res) => {
  try {
    const {
      equipment_id,
      reported_by,
      fault_type,
      description,
      parts_used
    } = req.body;

    // Insert fault
    const result = await dbRun(`
      INSERT INTO faults (
        equipment_id, reported_by, fault_type, description, status
      )
      VALUES (?, ?, ?, ?, 'open')
    `, [equipment_id, reported_by, fault_type, description]);

    const faultId = result.lastID;

    // Insert parts used if provided
    if (parts_used && Array.isArray(parts_used)) {
      for (const part of parts_used) {
        await dbRun(`
          INSERT INTO parts_used (
            fault_id, part_number, description, quantity, unit_cost
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          faultId,
          part.part_number,
          part.description,
          part.quantity || 1,
          part.unit_cost || 0
        ]);
      }
    }

    res.status(201).json({
      id: faultId,
      message: 'Fault report created successfully'
    });

  } catch (error) {
    console.error('Create fault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active faults for a vessel
router.get('/vessel/:vesselId/active', async (req, res) => {
  try {
    const { vesselId } = req.params;

    const faults = await dbAll(`
      SELECT 
        f.*,
        e.name as equipment_name,
        e.location as equipment_location,
        e.qr_code,
        u.first_name || ' ' || u.last_name as reported_by_name,
        ROUND((julianday('now') - julianday(f.started_at)) * 24 * 60) as duration_minutes
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      JOIN users u ON f.reported_by = u.id
      WHERE e.vessel_id = ? AND f.status IN ('open', 'in_progress')
      ORDER BY f.fault_type DESC, f.started_at DESC
    `, [vesselId]);

    res.json(faults);

  } catch (error) {
    console.error('Get active faults error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update fault status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, root_cause } = req.body;

    let updateQuery = 'UPDATE faults SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];

    if (status === 'resolved' || status === 'closed') {
      updateQuery += ', resolved_at = CURRENT_TIMESTAMP';
      
      // Calculate downtime
      const fault = await dbGet('SELECT started_at FROM faults WHERE id = ?', [id]);
      if (fault) {
        updateQuery += ', downtime_minutes = ROUND((julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 24 * 60)';
      }
    }

    if (resolution) {
      updateQuery += ', resolution = ?';
      params.push(resolution);
    }

    if (root_cause) {
      updateQuery += ', root_cause = ?';
      params.push(root_cause);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await dbRun(updateQuery, params);

    res.json({ message: 'Fault status updated successfully' });

  } catch (error) {
    console.error('Update fault status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fault statistics for manager dashboard
router.get('/stats/:vesselId', async (req, res) => {
  try {
    const { vesselId } = req.params;

    // Get fault counts by status
    const statusCounts = await dbAll(`
      SELECT 
        f.status,
        COUNT(*) as count
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = ?
      GROUP BY f.status
    `, [vesselId]);

    // Get average resolution time
    const avgResolutionTime = await dbGet(`
      SELECT 
        AVG(f.downtime_minutes) as avg_downtime
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = ? AND f.status IN ('resolved', 'closed')
    `, [vesselId]);

    // Get fault counts by type
    const typeCounts = await dbAll(`
      SELECT 
        f.fault_type,
        COUNT(*) as count
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = ?
      GROUP BY f.fault_type
    `, [vesselId]);

    // Get top fault locations
    const topLocations = await dbAll(`
      SELECT 
        e.location,
        COUNT(*) as fault_count
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = ?
      GROUP BY e.location
      ORDER BY fault_count DESC
      LIMIT 5
    `, [vesselId]);

    res.json({
      statusCounts,
      avgResolutionTime: avgResolutionTime?.avg_downtime || 0,
      typeCounts,
      topLocations
    });

  } catch (error) {
    console.error('Get fault stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get parts used with markup calculations (internal dashboard)
router.get('/revenue/:vesselId', async (req, res) => {
  try {
    const { vesselId } = req.params;

    const partsRevenue = await dbAll(`
      SELECT 
        p.*,
        p.unit_cost * p.quantity as base_cost,
        p.unit_cost * p.quantity * (p.markup_percentage / 100) as markup_amount,
        p.unit_cost * p.quantity * (1 + p.markup_percentage / 100) as total_cost,
        e.name as equipment_name,
        f.started_at as fault_date
      FROM parts_used p
      JOIN faults f ON p.fault_id = f.id
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = ?
      ORDER BY f.started_at DESC
    `, [vesselId]);

    // Calculate totals
    const totals = partsRevenue.reduce((acc, part) => {
      acc.totalBaseCost += part.base_cost || 0;
      acc.totalMarkup += part.markup_amount || 0;
      acc.totalRevenue += part.total_cost || 0;
      return acc;
    }, {
      totalBaseCost: 0,
      totalMarkup: 0,
      totalRevenue: 0
    });

    res.json({
      parts: partsRevenue,
      totals
    });

  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;