import { Router } from 'express';
import { AuthRequest, authMiddleware, isAdmin } from '../middleware/auth.middleware';
import { dbAll, dbGet, dbRun } from '../config/database';
import { activationCodeService } from '../services/activation-code.service';
import { Response } from 'express';
import {
  auditActivationGenerate,
  auditActivationExtend,
  auditActivationRevoke
} from '../middleware/auditLog.middleware';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(isAdmin);

// Get all activation codes with filtering
router.get('/codes', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      status = 'all', 
      companyId, 
      search,
      page = 1,
      limit = 20 
    } = req.query;

    let query = `
      SELECT 
        ac.id,
        ac.code,
        ac.expires_at,
        ac.activated_at,
        ac.reminder_sent_at,
        ac.expired_notification_sent,
        ac.created_at,
        ac.updated_at,
        c.id as company_id,
        c.name as company_name,
        c.contact_email,
        c.contact_name,
        (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
        (SELECT COUNT(*) FROM vessels WHERE company_id = c.id) as vessel_count
      FROM activation_codes ac
      JOIN companies c ON ac.company_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter by status
    if (status === 'active') {
      query += ` AND ac.activated_at IS NULL AND ac.expires_at > datetime('now')`;
    } else if (status === 'activated') {
      query += ` AND ac.activated_at IS NOT NULL`;
    } else if (status === 'expired') {
      query += ` AND ac.activated_at IS NULL AND ac.expires_at <= datetime('now')`;
    }

    // Filter by company
    if (companyId) {
      query += ` AND c.id = ?`;
      params.push(companyId);
    }

    // Search by code or company name
    if (search) {
      query += ` AND (ac.code LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add ordering
    query += ` ORDER BY ac.created_at DESC`;

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await dbGet(countQuery, params);
    const total = countResult?.total || 0;

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const codes = await dbAll(query, params);

    res.json({
      codes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activation codes:', error);
    res.status(500).json({ error: 'Failed to fetch activation codes' });
  }
});

// Get activation code details and history
router.get('/codes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const code = await dbGet(`
      SELECT 
        ac.*,
        c.name as company_name,
        c.contact_email,
        c.contact_name,
        c.created_at as company_created_at
      FROM activation_codes ac
      JOIN companies c ON ac.company_id = c.id
      WHERE ac.id = ?
    `, [id]);

    if (!code) {
      res.status(404).json({ error: 'Activation code not found' });
      return;
    }

    // Get activation history (user who activated)
    let activatedBy = null;
    if (code.activated_at) {
      activatedBy = await dbGet(`
        SELECT id, email, name, created_at
        FROM users
        WHERE company_id = ? AND created_at >= ?
        ORDER BY created_at ASC
        LIMIT 1
      `, [code.company_id, code.activated_at]);
    }

    // Get all codes for this company
    const companyCodesHistory = await dbAll(`
      SELECT id, code, expires_at, activated_at, created_at
      FROM activation_codes
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [code.company_id]);

    res.json({
      ...code,
      activatedBy,
      companyCodesHistory
    });
  } catch (error) {
    console.error('Error fetching activation code details:', error);
    res.status(500).json({ error: 'Failed to fetch code details' });
  }
});

// Generate new activation code
router.post('/codes/generate', 
  auditActivationGenerate,
  async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, expiryDays = 30, sendEmail = false } = req.body;

    // Validate company exists
    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    // Generate code
    const code = await activationCodeService.createActivationCode(companyId, expiryDays);

    // Optionally send email
    if (sendEmail && company.contact_email) {
      await activationCodeService.sendActivationCode(
        companyId,
        company.contact_email,
        company.contact_name || 'Team',
        process.env.FRONTEND_URL || 'http://localhost:3000'
      );
    }

    res.json({ 
      success: true, 
      code,
      message: sendEmail ? 'Code generated and email sent' : 'Code generated'
    });
  } catch (error) {
    console.error('Error generating activation code:', error);
    res.status(500).json({ error: 'Failed to generate activation code' });
  }
});

// Extend activation code expiry
router.put('/codes/:id/extend', 
  auditActivationExtend,
  async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.body;

    const code = await dbGet('SELECT * FROM activation_codes WHERE id = ?', [id]);
    if (!code) {
      res.status(404).json({ error: 'Activation code not found' });
      return;
    }

    if (code.activated_at) {
      res.status(400).json({ error: 'Cannot extend activated code' });
      return;
    }

    // Calculate new expiry
    const currentExpiry = new Date(code.expires_at);
    const now = new Date();
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    // Update expiry
    await dbRun(`
      UPDATE activation_codes
      SET expires_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [newExpiry.toISOString(), id]);

    res.json({ 
      success: true, 
      newExpiry: newExpiry.toISOString(),
      message: `Code expiry extended by ${days} days`
    });
  } catch (error) {
    console.error('Error extending activation code:', error);
    res.status(500).json({ error: 'Failed to extend code' });
  }
});

// Revoke activation code
router.delete('/codes/:id', 
  auditActivationRevoke,
  async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const code = await dbGet('SELECT * FROM activation_codes WHERE id = ?', [id]);
    if (!code) {
      res.status(404).json({ error: 'Activation code not found' });
      return;
    }

    if (code.activated_at) {
      res.status(400).json({ error: 'Cannot revoke activated code' });
      return;
    }

    // Set expiry to past date to effectively revoke
    await dbRun(`
      UPDATE activation_codes
      SET expires_at = datetime('now', '-1 day'),
          updated_at = datetime('now')
      WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Code revoked successfully' });
  } catch (error) {
    console.error('Error revoking activation code:', error);
    res.status(500).json({ error: 'Failed to revoke code' });
  }
});

// Get activation analytics
router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = ' WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Overall statistics
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(CASE WHEN activated_at IS NOT NULL THEN 1 ELSE 0 END) as activated_codes,
        SUM(CASE WHEN activated_at IS NULL AND expires_at > datetime('now') THEN 1 ELSE 0 END) as active_codes,
        SUM(CASE WHEN activated_at IS NULL AND expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired_codes
      FROM activation_codes${dateFilter}
    `, params);

    // Activation rate by time period
    const activationTimes = await dbAll(`
      SELECT 
        julianday(activated_at) - julianday(created_at) as days_to_activate,
        COUNT(*) as count
      FROM activation_codes
      WHERE activated_at IS NOT NULL${dateFilter ? ' AND' + dateFilter.substring(6) : ''}
      GROUP BY days_to_activate
      ORDER BY days_to_activate
    `, params);

    // Failed activation attempts (from help requests)
    const failedAttempts = await dbGet(`
      SELECT COUNT(*) as count
      FROM activation_help${dateFilter}
    `, params);

    // Average time to activation
    const avgActivation = await dbGet(`
      SELECT AVG(julianday(activated_at) - julianday(created_at)) as avg_days
      FROM activation_codes
      WHERE activated_at IS NOT NULL${dateFilter ? ' AND' + dateFilter.substring(6) : ''}
    `, params);

    // Monthly trends
    const monthlyTrends = await dbAll(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as total,
        SUM(CASE WHEN activated_at IS NOT NULL THEN 1 ELSE 0 END) as activated
      FROM activation_codes${dateFilter}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, params);

    res.json({
      stats: {
        ...stats,
        activation_rate: stats.total_codes > 0 
          ? ((stats.activated_codes / stats.total_codes) * 100).toFixed(1) 
          : 0,
        avg_days_to_activate: avgActivation?.avg_days?.toFixed(1) || 0
      },
      activationTimes,
      failedAttempts: failedAttempts?.count || 0,
      monthlyTrends
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export codes to CSV
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'all', companyId } = req.query;

    let query = `
      SELECT 
        ac.code,
        c.name as company_name,
        c.contact_email,
        ac.created_at,
        ac.expires_at,
        ac.activated_at,
        CASE 
          WHEN ac.activated_at IS NOT NULL THEN 'Activated'
          WHEN ac.expires_at <= datetime('now') THEN 'Expired'
          ELSE 'Active'
        END as status
      FROM activation_codes ac
      JOIN companies c ON ac.company_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status === 'active') {
      query += ` AND ac.activated_at IS NULL AND ac.expires_at > datetime('now')`;
    } else if (status === 'activated') {
      query += ` AND ac.activated_at IS NOT NULL`;
    } else if (status === 'expired') {
      query += ` AND ac.activated_at IS NULL AND ac.expires_at <= datetime('now')`;
    }

    if (companyId) {
      query += ` AND c.id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY ac.created_at DESC`;

    const codes = await dbAll(query, params);

    // Create CSV content
    const headers = ['Code', 'Company', 'Email', 'Created', 'Expires', 'Activated', 'Status'];
    const rows = codes.map(code => [
      code.code,
      code.company_name,
      code.contact_email || '',
      new Date(code.created_at).toLocaleDateString(),
      new Date(code.expires_at).toLocaleDateString(),
      code.activated_at ? new Date(code.activated_at).toLocaleDateString() : '',
      code.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activation-codes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting codes:', error);
    res.status(500).json({ error: 'Failed to export codes' });
  }
});

export default router;