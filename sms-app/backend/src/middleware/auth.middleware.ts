import { Request, Response, NextFunction } from 'express';
import { dbGet } from '../config/database.abstraction';
import { AuthService } from '../services/auth.service';

// Extended Request interface to include user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name?: string;
    role: 'technician' | 'manager' | 'admin' | 'mechanic' | 'hse' | 'electrical_manager' | 'mechanical_manager' | 'hse_manager';
    companyId: number;
    companySlug: string;
    vesselId?: number;
    department?: string;
  };
}

// Role to dashboard mapping
export const ROLE_DASHBOARDS = {
  technician: '/dashboard/technician',
  manager: '/dashboard/manager',
  admin: '/dashboard/internal',
  mechanic: '/dashboard/mechanic',
  hse: '/dashboard/hse',
  electrical_manager: '/dashboard/electrical-manager',
  mechanical_manager: '/dashboard/mechanical-manager',
  hse_manager: '/dashboard/hse-manager'
};

// Demo user role mapping (based on the frontend demo accounts)
export const DEMO_USER_ROLES: Record<string, { role: 'technician' | 'manager' | 'admin'; specialization?: string }> = {
  'john.doe@oceanic.com': { role: 'technician', specialization: 'Electrician' },
  'mike.chen@oceanic.com': { role: 'technician', specialization: 'Mechanic' },
  'sarah.williams@oceanic.com': { role: 'technician', specialization: 'HSE Officer' },
  'tom.rodriguez@oceanic.com': { role: 'manager', specialization: 'Electrical Manager' },
  'james.wilson@oceanic.com': { role: 'manager', specialization: 'Mechanical Manager' },
  'admin@smsportal.com': { role: 'admin', specialization: 'SMS Portal Admin' },
  // Add HSE Manager demo user
  'lisa.anderson@oceanic.com': { role: 'manager', specialization: 'HSE Manager' },
  // Keep existing demo accounts for backwards compatibility
  'demo.tech@oceanic.com': { role: 'technician' },
  'demo.manager@oceanic.com': { role: 'manager' },
  'demo.admin@oceanic.com': { role: 'admin' }
};

// Auth middleware
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify access token using AuthService
    const decoded = AuthService.verifyAccessToken(token);

    // Get user from database
    const user = await dbGet(`
      SELECT id, email, name, role, company_id, is_active, default_vessel_id, department
      FROM users 
      WHERE id = ?
    `, [decoded.id]);

    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.company_id,
      companySlug: decoded.companySlug,
      vesselId: user.default_vessel_id,
      department: user.department
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// Role check middleware
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};

// Admin check middleware
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
};

// Alias for backward compatibility
export const authenticateToken = authMiddleware;

// Role authorization middleware
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}` });
      return;
    }

    next();
  };
};

// Get dashboard redirect for user
export const getDashboardForUser = (email: string, role: string): string => {
  // Check if it's a demo user with specific specialization
  const demoUser = DEMO_USER_ROLES[email];
  if (demoUser && demoUser.specialization) {
    // Map specializations to specific dashboard routes
    switch (demoUser.specialization) {
      case 'Electrician':
        return '/dashboard/technician'; // Default technician dashboard
      case 'Mechanic':
        return '/dashboard/mechanic';
      case 'HSE Officer':
        return '/dashboard/hse';
      case 'Electrical Manager':
        return '/dashboard/electrical-manager';
      case 'Mechanical Manager':
        return '/dashboard/mechanical-manager';
      case 'HSE Manager':
        return '/dashboard/hse-manager';
      case 'SMS Portal Admin':
        return '/dashboard/internal';
      default:
        return ROLE_DASHBOARDS[demoUser.role];
    }
  }
  
  // Fallback to general role-based redirect
  return ROLE_DASHBOARDS[role as keyof typeof ROLE_DASHBOARDS] || '/dashboard/technician';
};