import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../config/database.abstraction';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get equipment by QR code
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const equipment = await dbGet(`
      SELECT 
        e.*,
        v.name as vessel_name,
        v.company_id,
        c.name as company_name
      FROM equipment e
      JOIN vessels v ON e.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE e.qr_code = ?
    `, [qrCode]);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Parse specifications JSON
    if (equipment.specifications) {
      equipment.specifications = JSON.parse(equipment.specifications);
    }

    res.json(equipment);

  } catch (error) {
    console.error('Get equipment by QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all equipment for a vessel
router.get('/vessel/:vesselId', async (req, res) => {
  try {
    const { vesselId } = req.params;
    const { location, type, status } = req.query;

    let query = `
      SELECT 
        id,
        qr_code,
        name,
        manufacturer,
        model,
        serial_number,
        location,
        equipment_type,
        status,
        criticality,
        classification,
        last_maintenance_date,
        next_maintenance_date
      FROM equipment
      WHERE vessel_id = ?
    `;

    const params: any[] = [vesselId];

    if (location) {
      query += ' AND location = ?';
      params.push(location);
    }

    if (type) {
      query += ' AND equipment_type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY location, name';

    const equipment = await dbAll(query, params);

    res.json(equipment);

  } catch (error) {
    console.error('Get vessel equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get equipment by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await dbGet(`
      SELECT 
        e.*,
        v.name as vessel_name,
        v.company_id,
        c.name as company_name
      FROM equipment e
      JOIN vessels v ON e.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE e.id = ?
    `, [id]);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Parse specifications JSON
    if (equipment.specifications) {
      equipment.specifications = JSON.parse(equipment.specifications);
    }

    // Get documents
    const documents = await dbAll(`
      SELECT 
        id,
        document_type,
        file_name,
        file_path,
        file_size,
        description,
        created_at
      FROM equipment_documents
      WHERE equipment_id = ?
      ORDER BY document_type, file_name
    `, [id]);

    // Get recent faults
    const recentFaults = await dbAll(`
      SELECT 
        f.id,
        f.fault_type,
        f.status,
        f.description,
        f.started_at,
        f.resolved_at,
        f.downtime_minutes,
        u.first_name || ' ' || u.last_name as reported_by_name
      FROM faults f
      JOIN users u ON f.reported_by = u.id
      WHERE f.equipment_id = ?
      ORDER BY f.started_at DESC
      LIMIT 5
    `, [id]);

    // Get maintenance history
    const maintenanceHistory = await dbAll(`
      SELECT 
        m.id,
        m.maintenance_type,
        m.description,
        m.completed_at,
        m.next_due_date,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM maintenance_logs m
      JOIN users u ON m.performed_by = u.id
      WHERE m.equipment_id = ?
      ORDER BY m.completed_at DESC
      LIMIT 5
    `, [id]);

    res.json({
      ...equipment,
      documents,
      recentFaults,
      maintenanceHistory
    });

  } catch (error) {
    console.error('Get equipment details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const {
      vessel_id,
      name,
      manufacturer,
      model,
      serial_number,
      location,
      equipment_type,
      installation_date,
      specifications
    } = req.body;

    // Generate unique QR code
    const qr_code = `SMS-${uuidv4().substring(0, 8).toUpperCase()}`;

    const result = await dbRun(`
      INSERT INTO equipment (
        vessel_id, qr_code, name, manufacturer, model,
        serial_number, location, equipment_type, installation_date,
        specifications
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vessel_id,
      qr_code,
      name,
      manufacturer,
      model,
      serial_number,
      location,
      equipment_type,
      installation_date,
      JSON.stringify(specifications || {})
    ]);

    res.status(201).json({
      id: result.lastID,
      qr_code,
      message: 'Equipment created successfully'
    });

  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get equipment locations for a vessel
router.get('/vessel/:vesselId/locations', async (req, res) => {
  try {
    const { vesselId } = req.params;

    const locations = await dbAll(`
      SELECT DISTINCT 
        location,
        COUNT(*) as equipment_count
      FROM equipment
      WHERE vessel_id = ?
      GROUP BY location
      ORDER BY location
    `, [vesselId]);

    res.json(locations);

  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get equipment types
router.get('/vessel/:vesselId/types', async (req, res) => {
  try {
    const { vesselId } = req.params;

    const types = await dbAll(`
      SELECT DISTINCT 
        equipment_type,
        COUNT(*) as equipment_count
      FROM equipment
      WHERE vessel_id = ?
      GROUP BY equipment_type
      ORDER BY equipment_type
    `, [vesselId]);

    res.json(types);

  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;