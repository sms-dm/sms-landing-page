import { Router } from 'express';
import { dbAll } from '../config/database.abstraction';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all vessels for the user's company
router.get('/', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user?.companyId;

    const vessels = await dbAll(`
      SELECT 
        id,
        name,
        imo_number,
        vessel_type,
        status
      FROM vessels
      WHERE company_id = ?
        AND status != 'decommissioned'
      ORDER BY name
    `, companyId);

    res.json(vessels);

  } catch (error) {
    console.error('Get vessels error:', error);
    res.status(500).json({ error: 'Failed to get vessels' });
  }
});

export default router;