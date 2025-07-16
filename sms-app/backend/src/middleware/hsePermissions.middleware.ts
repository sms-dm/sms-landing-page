import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { HseService } from '../services/hse.service';

// Middleware to check if user can create HSE updates
export const canCreateHseMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!HseService.canCreateHseUpdate(req.user!.role)) {
      return res.status(403).json({
        error: 'You do not have permission to create HSE updates'
      });
    }
    next();
  } catch (error) {
    console.error('HSE create permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE permissions' });
  }
};

// Middleware to check if user can view acknowledgments
export const canViewAcknowledgmentsMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!HseService.canViewAcknowledgments(req.user!.role)) {
      return res.status(403).json({
        error: 'You do not have permission to view acknowledgment details'
      });
    }
    next();
  } catch (error) {
    console.error('HSE acknowledgment permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE permissions' });
  }
};

// Middleware to check if user can edit HSE update
export const canEditHseMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateId = parseInt(req.params.updateId);
    
    // Get the HSE update
    const update = await dbGet(`
      SELECT created_by FROM hse_updates WHERE id = ?
    `, [updateId]);
    
    if (!update) {
      return res.status(404).json({ error: 'HSE update not found' });
    }
    
    // Check if user is creator or has admin/hse_manager role
    const canEdit = update.created_by === req.user!.id || 
                   ['hse_manager', 'admin'].includes(req.user!.role);
    
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to edit this HSE update'
      });
    }
    
    next();
  } catch (error) {
    console.error('HSE edit permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE permissions' });
  }
};

// Middleware to check if user can send reminders
export const canSendRemindersMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allowedRoles = ['hse', 'hse_manager', 'admin'];
    
    if (!allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'You do not have permission to send HSE reminders'
      });
    }
    
    next();
  } catch (error) {
    console.error('HSE reminder permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE permissions' });
  }
};

// Middleware to check if user can export reports
export const canExportReportsMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allowedRoles = ['hse', 'hse_manager', 'admin'];
    
    if (!allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'You do not have permission to export HSE reports'
      });
    }
    
    next();
  } catch (error) {
    console.error('HSE export permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE permissions' });
  }
};

// Middleware to check HSE scope access
export const checkHseScopeAccessMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateId = parseInt(req.params.updateId);
    
    // Get the HSE update
    const update = await dbGet(`
      SELECT scope, vessel_id, department FROM hse_updates WHERE id = ?
    `, [updateId]);
    
    if (!update) {
      return res.status(404).json({ error: 'HSE update not found' });
    }
    
    // Check scope access
    let hasAccess = true;
    
    if (update.scope === 'vessel' && update.vessel_id) {
      // Check if user belongs to the vessel
      const userVessel = await dbGet(`
        SELECT default_vessel_id FROM users WHERE id = ?
      `, [req.user!.id]);
      
      hasAccess = userVessel.default_vessel_id === update.vessel_id || 
                 ['admin', 'hse_manager'].includes(req.user!.role);
    } else if (update.scope === 'department' && update.department) {
      // Check if user belongs to the department
      hasAccess = req.user!.department === update.department || 
                 ['admin', 'hse_manager'].includes(req.user!.role);
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'You do not have access to this HSE update based on its scope'
      });
    }
    
    // Store update in request for later use
    req.hseUpdate = update;
    next();
  } catch (error) {
    console.error('HSE scope access middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE scope access' });
  }
};

// Extend AuthRequest to include HSE update
import { dbGet } from '../config/database.abstraction';

declare module '../middleware/auth.middleware' {
  interface AuthRequest {
    hseUpdate?: {
      scope: string;
      vessel_id?: number;
      department?: string;
      [key: string]: any;
    };
  }
}