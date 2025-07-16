import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../config/database.abstraction';
import bcrypt from 'bcryptjs';

// JWT secrets - in production these should be shared between portals
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'shared-bridge-secret-between-portals';

interface BridgeTokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  portalOrigin: 'onboarding' | 'maintenance';
  issuedAt: number;
  expiresAt: number;
}

// Validate a bridge token from the Onboarding portal
export const validateBridgeToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { bridgeToken } = req.body;
    
    if (!bridgeToken) {
      return res.status(400).json({ error: 'Bridge token required' });
    }

    // Verify the bridge token
    let decoded: BridgeTokenPayload;
    try {
      decoded = jwt.verify(bridgeToken, BRIDGE_SECRET) as BridgeTokenPayload;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid bridge token' });
    }

    // Check if token is expired
    if (decoded.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Bridge token expired' });
    }

    // Check if user exists in our system
    let user = await dbGet(
      'SELECT * FROM users WHERE email = ?',
      [decoded.email]
    );

    if (!user) {
      // User doesn't exist, create them
      // First ensure company exists
      let company = await dbGet(
        'SELECT id FROM companies WHERE name = ?',
        [decoded.companyName]
      );

      if (!company) {
        // Create company
        const slug = decoded.companyName.toLowerCase().replace(/\s+/g, '-');
        await dbRun(
          'INSERT INTO companies (name, slug) VALUES (?, ?)',
          [decoded.companyName, slug]
        );
        company = await dbGet('SELECT id FROM companies WHERE slug = ?', [slug]);
      }

      // Create user with temporary password
      const tempPassword = `Bridge${Date.now()}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      // Map role from onboarding to maintenance
      const mappedRole = mapRole(decoded.role);
      
      await dbRun(
        `INSERT INTO users (
          company_id, email, password_hash, first_name, last_name, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          company.id,
          decoded.email,
          passwordHash,
          decoded.email.split('@')[0].split('.')[0] || 'User',
          decoded.email.split('@')[0].split('.')[1] || 'Account',
          mappedRole
        ]
      );

      user = await dbGet('SELECT * FROM users WHERE email = ?', [decoded.email]);
    }

    // Generate maintenance portal JWT
    const maintenanceToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        companySlug: decoded.companyName.toLowerCase().replace(/\s+/g, '-')
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get company details
    const company = await dbGet(
      'SELECT * FROM companies WHERE id = ?',
      [user.company_id]
    );

    return res.json({
      success: true,
      token: maintenanceToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug
        }
      },
      message: 'Bridge authentication successful'
    });

  } catch (error) {
    console.error('Bridge token validation error:', error);
    return res.status(500).json({ error: 'Authentication bridge failed' });
  }
};

// Generate a bridge token for going TO the Onboarding portal
export const generateBridgeToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    
    // Get company details
    const company = await dbGet(
      'SELECT name FROM companies WHERE id = ?',
      [user.companyId]
    );

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create bridge token payload
    const payload: BridgeTokenPayload = {
      userId: user.id.toString(),
      email: user.email,
      role: reverseMapRole(user.role),
      companyId: user.companyId.toString(),
      companyName: company.name,
      portalOrigin: 'maintenance',
      issuedAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };

    // Sign the bridge token
    const bridgeToken = jwt.sign(payload, BRIDGE_SECRET);

    // Get the onboarding portal URL from environment
    const onboardingUrl = process.env.ONBOARDING_PORTAL_URL || 'http://localhost:5173';

    return res.json({
      success: true,
      bridgeToken,
      redirectUrl: `${onboardingUrl}/auth/bridge?token=${encodeURIComponent(bridgeToken)}`,
      expiresIn: 300 // seconds
    });

  } catch (error) {
    console.error('Bridge token generation error:', error);
    return res.status(500).json({ error: 'Failed to generate bridge token' });
  }
};

// Map onboarding roles to maintenance roles
function mapRole(onboardingRole: string): string {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'admin',
    'ADMIN': 'admin',
    'MANAGER': 'manager',
    'TECHNICIAN': 'technician',
    'HSE_OFFICER': 'technician',
    'VIEWER': 'technician'
  };
  return roleMap[onboardingRole] || 'technician';
}

// Map maintenance roles to onboarding roles
function reverseMapRole(maintenanceRole: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'ADMIN',
    'manager': 'MANAGER',
    'technician': 'TECHNICIAN',
    'mechanic': 'TECHNICIAN',
    'hse': 'HSE_OFFICER',
    'electrical_manager': 'MANAGER',
    'mechanical_manager': 'MANAGER',
    'hse_manager': 'MANAGER'
  };
  return roleMap[maintenanceRole] || 'VIEWER';
}

