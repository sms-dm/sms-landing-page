import { Router } from 'express';
import { dbGet, dbAll } from '../config/database';

const router = Router();

// Get company by slug (for branded login page)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const company = await dbGet(`
      SELECT 
        id,
        name,
        slug,
        logo_url,
        primary_color,
        secondary_color
      FROM companies
      WHERE slug = ?
    `, [slug]);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vessels for a company
router.get('/:companyId/vessels', async (req, res) => {
  try {
    const { companyId } = req.params;

    const vessels = await dbAll(`
      SELECT 
        id,
        name,
        imo_number,
        vessel_type,
        image_url,
        status
      FROM vessels
      WHERE company_id = ? AND status = 'operational'
      ORDER BY name
    `, [companyId]);

    res.json(vessels);

  } catch (error) {
    console.error('Get vessels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all companies (for demo/testing)
router.get('/', async (req, res) => {
  try {
    const companies = await dbAll(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.logo_url,
        COUNT(DISTINCT v.id) as vessel_count,
        COUNT(DISTINCT u.id) as user_count
      FROM companies c
      LEFT JOIN vessels v ON v.company_id = c.id
      LEFT JOIN users u ON u.company_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(companies);

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;