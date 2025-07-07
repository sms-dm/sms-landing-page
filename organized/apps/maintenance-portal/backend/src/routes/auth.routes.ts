import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../config/database';
import { authMiddleware, getDashboardForUser, DEMO_USER_ROLES, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with company info
    const user = await dbGet(`
      SELECT 
        u.*,
        c.name as company_name,
        c.slug as company_slug,
        c.logo_url as company_logo,
        c.primary_color,
        c.secondary_color
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.email = ? AND u.is_active = 1
    `, [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (for demo, we'll skip actual verification)
    // In production: const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = password === 'demo123' || password === 'password123'; // Demo passwords

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        companySlug: user.company_slug
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove sensitive data
    delete user.password_hash;

    // Get the appropriate dashboard URL for the user
    const dashboardUrl = getDashboardForUser(user.email, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        company: {
          id: user.company_id,
          name: user.company_name,
          slug: user.company_slug,
          logoUrl: user.company_logo,
          primaryColor: user.primary_color,
          secondaryColor: user.secondary_color
        },
        dashboardUrl: dashboardUrl
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Get user data
    const user = await dbGet(`
      SELECT 
        u.*,
        c.name as company_name,
        c.slug as company_slug,
        c.logo_url as company_logo,
        c.primary_color,
        c.secondary_color
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.id = ? AND u.is_active = 1
    `, [req.user!.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    delete user.password_hash;

    // Get the appropriate dashboard URL for the user
    const dashboardUrl = getDashboardForUser(user.email, user.role);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      company: {
        id: user.company_id,
        name: user.company_name,
        slug: user.company_slug,
        logoUrl: user.company_logo,
        primaryColor: user.primary_color,
        secondaryColor: user.secondary_color
      },
      dashboardUrl: dashboardUrl
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side will remove token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;