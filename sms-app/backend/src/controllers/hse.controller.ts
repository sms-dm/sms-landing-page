import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbAll, dbRun } from '../config/database.abstraction';
import { HseService } from '../services/hse.service';
import { NotificationService } from '../services/notification.service';

export class HseController {
  // Get HSE updates with filters
  static async getHseUpdates(req: AuthRequest, res: Response) {
    try {
      const { 
        scope, 
        severity, 
        update_type,
        active_only, 
        vessel_id, 
        department,
        requires_acknowledgment,
        limit = 50,
        offset = 0
      } = req.query;
      
      let query = `
        SELECT h.*, 
          u.name as creator_name, 
          u.email as creator_email,
          u.role as creator_role,
          v.name as vessel_name,
          CASE WHEN ha.id IS NOT NULL THEN true ELSE false END as is_acknowledged,
          ha.acknowledged_at,
          (
            SELECT COUNT(*) FROM hse_acknowledgments 
            WHERE hse_update_id = h.id
          ) as acknowledgment_count
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        LEFT JOIN vessels v ON h.vessel_id = v.id
        LEFT JOIN hse_acknowledgments ha ON h.id = ha.hse_update_id AND ha.user_id = ?
        WHERE 1=1
      `;
      
      const params: any[] = [req.user!.id];
      
      // Apply filters
      if (scope) {
        query += ` AND h.scope = ?`;
        params.push(scope);
      }
      
      if (severity) {
        query += ` AND h.severity = ?`;
        params.push(severity);
      }
      
      if (update_type) {
        query += ` AND h.update_type = ?`;
        params.push(update_type);
      }
      
      if (active_only === 'true') {
        query += ` AND h.is_active = true AND (h.expires_at IS NULL OR h.expires_at > CURRENT_TIMESTAMP)`;
      }
      
      if (requires_acknowledgment !== undefined) {
        query += ` AND h.requires_acknowledgment = ?`;
        params.push(requires_acknowledgment === 'true');
      }
      
      // Apply scope-based filtering
      if (vessel_id) {
        query += ` AND (h.vessel_id = ? OR h.scope = 'fleet')`;
        params.push(vessel_id);
      } else if (req.user!.vesselId) {
        query += ` AND (h.vessel_id = ? OR h.vessel_id IS NULL OR h.scope = 'fleet')`;
        params.push(req.user!.vesselId);
      }
      
      if (department) {
        query += ` AND (h.department = ? OR h.department IS NULL OR h.scope = 'fleet')`;
        params.push(department);
      } else if (req.user!.department) {
        query += ` AND (h.department = ? OR h.department IS NULL OR h.scope != 'department')`;
        params.push(req.user!.department);
      }
      
      // Count total before pagination
      const countQuery = query.replace(
        'SELECT h.*, u.name as creator_name, u.email as creator_email, u.role as creator_role, v.name as vessel_name, CASE WHEN ha.id IS NOT NULL THEN true ELSE false END as is_acknowledged, ha.acknowledged_at, (SELECT COUNT(*) FROM hse_acknowledgments WHERE hse_update_id = h.id) as acknowledgment_count',
        'SELECT COUNT(*) as total'
      );
      const totalResult = await dbGet(countQuery, params);
      
      query += ` ORDER BY h.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const updates = await dbAll(query, params);
      
      // Get tags for each update
      const updatesWithTags = await Promise.all(
        updates.map(async (update) => {
          const tags = update.tags ? update.tags.replace(/[{}]/g, '').split(',') : [];
          return { ...update, tags };
        })
      );
      
      res.json({ 
        updates: updatesWithTags,
        total: totalResult.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error) {
      console.error('Error fetching HSE updates:', error);
      res.status(500).json({ error: 'Failed to fetch HSE updates' });
    }
  }

  // Get specific HSE update with full details
  static async getHseUpdate(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      
      const update = await dbGet(`
        SELECT h.*, 
          u.name as creator_name, 
          u.email as creator_email,
          u.role as creator_role,
          v.name as vessel_name,
          CASE WHEN ha.id IS NOT NULL THEN true ELSE false END as is_acknowledged,
          ha.acknowledged_at,
          ha.comments as user_acknowledgment_comments
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        LEFT JOIN vessels v ON h.vessel_id = v.id
        LEFT JOIN hse_acknowledgments ha ON h.id = ha.hse_update_id AND ha.user_id = ?
        WHERE h.id = ?
      `, [req.user!.id, updateId]);
      
      if (!update) {
        return res.status(404).json({ error: 'HSE update not found' });
      }
      
      // Get attachments
      const attachments = await dbAll(`
        SELECT * FROM hse_attachments WHERE hse_update_id = ?
      `, [updateId]);
      
      // Get acknowledgments if user has permission
      let acknowledgments = [];
      let acknowledgmentStats = null;
      
      if (HseService.canViewAcknowledgments(req.user!.role)) {
        acknowledgments = await dbAll(`
          SELECT ha.*, 
            u.name as user_name, 
            u.email as user_email, 
            u.department,
            u.role as user_role
          FROM hse_acknowledgments ha
          JOIN users u ON ha.user_id = u.id
          WHERE ha.hse_update_id = ?
          ORDER BY ha.acknowledged_at DESC
        `, [updateId]);
        
        acknowledgmentStats = await HseService.getAcknowledgmentStats(updateId, update);
      }
      
      // Parse tags
      const tags = update.tags ? update.tags.replace(/[{}]/g, '').split(',') : [];
      
      res.json({ 
        update: {
          ...update,
          tags,
          attachments
        },
        acknowledgments: acknowledgments.length > 0 ? acknowledgments : undefined,
        acknowledgmentStats
      });
    } catch (error) {
      console.error('Error fetching HSE update:', error);
      res.status(500).json({ error: 'Failed to fetch HSE update' });
    }
  }

  // Create new HSE update
  static async createHseUpdate(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        content,
        update_type,
        severity,
        scope,
        vessel_id,
        department,
        requires_acknowledgment,
        acknowledgment_deadline,
        expires_at,
        tags,
        attachments,
        send_email_notification
      } = req.body;
      
      // Validate required fields
      if (!title || !content || !update_type || !severity || !scope) {
        return res.status(400).json({ 
          error: 'Title, content, update type, severity, and scope are required' 
        });
      }
      
      // Validate enums
      if (!HseService.isValidUpdateType(update_type)) {
        return res.status(400).json({ error: 'Invalid update type' });
      }
      
      if (!HseService.isValidSeverity(severity)) {
        return res.status(400).json({ error: 'Invalid severity' });
      }
      
      if (!HseService.isValidScope(scope)) {
        return res.status(400).json({ error: 'Invalid scope' });
      }
      
      // Validate scope requirements
      if (scope === 'vessel' && !vessel_id) {
        return res.status(400).json({ error: 'Vessel ID is required for vessel-scoped updates' });
      }
      
      if (scope === 'department' && !department) {
        return res.status(400).json({ error: 'Department is required for department-scoped updates' });
      }
      
      // Create HSE update
      const result = await dbRun(`
        INSERT INTO hse_updates (
          title, content, update_type, severity, scope, 
          vessel_id, department, requires_acknowledgment, 
          acknowledgment_deadline, expires_at, tags, created_by, is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
      `, [
        title,
        content,
        update_type,
        severity,
        scope,
        vessel_id || null,
        department || null,
        requires_acknowledgment || false,
        acknowledgment_deadline || null,
        expires_at || null,
        tags && tags.length > 0 ? `{${tags.join(',')}}` : null,
        req.user!.id
      ]);
      
      const updateId = result.lastID;
      
      // Handle attachments
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          await dbRun(`
            INSERT INTO hse_attachments (
              hse_update_id, file_name, file_url, file_type, file_size
            )
            VALUES (?, ?, ?, ?, ?)
          `, [updateId, attachment.name, attachment.url, attachment.type, attachment.size]);
        }
      }
      
      // Get the created update
      const update = await dbGet(`
        SELECT h.*, u.name as creator_name, u.email as creator_email
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        WHERE h.id = ?
      `, [updateId]);
      
      // Send notifications for critical/high severity updates
      if ((severity === 'critical' || severity === 'high') || send_email_notification) {
        await NotificationService.sendHseNotifications(update, req.user!);
      }
      
      // Create HSE channel message if configured
      if (process.env.HSE_CHANNEL_ID) {
        await HseService.createHseChannelMessage(update, req.user!);
      }
      
      res.status(201).json({ update });
    } catch (error) {
      console.error('Error creating HSE update:', error);
      res.status(500).json({ error: 'Failed to create HSE update' });
    }
  }

  // Update HSE update
  static async updateHseUpdate(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      const {
        title,
        content,
        severity,
        is_active,
        expires_at,
        tags,
        attachments
      } = req.body;
      
      // Check if update exists
      const existingUpdate = await dbGet(`
        SELECT * FROM hse_updates WHERE id = ?
      `, [updateId]);
      
      if (!existingUpdate) {
        return res.status(404).json({ error: 'HSE update not found' });
      }
      
      // Check permission (only creator or HSE managers can edit)
      if (existingUpdate.created_by !== req.user!.id && 
          !['hse_manager', 'admin'].includes(req.user!.role)) {
        return res.status(403).json({ error: 'You do not have permission to edit this update' });
      }
      
      // Update fields
      await dbRun(`
        UPDATE hse_updates 
        SET title = COALESCE(?, title), 
            content = COALESCE(?, content), 
            severity = COALESCE(?, severity), 
            is_active = COALESCE(?, is_active), 
            expires_at = CASE WHEN ? IS NOT NULL THEN ? ELSE expires_at END,
            tags = COALESCE(?, tags),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title,
        content,
        severity,
        is_active,
        expires_at !== undefined ? 1 : 0, expires_at,
        tags && tags.length > 0 ? `{${tags.join(',')}}` : null,
        updateId
      ]);
      
      // Handle attachment updates if provided
      if (attachments !== undefined) {
        // Remove existing attachments
        await dbRun(`DELETE FROM hse_attachments WHERE hse_update_id = ?`, [updateId]);
        
        // Add new attachments
        if (Array.isArray(attachments)) {
          for (const attachment of attachments) {
            await dbRun(`
              INSERT INTO hse_attachments (
                hse_update_id, file_name, file_url, file_type, file_size
              )
              VALUES (?, ?, ?, ?, ?)
            `, [updateId, attachment.name, attachment.url, attachment.type, attachment.size]);
          }
        }
      }
      
      const update = await dbGet(`
        SELECT h.*, u.name as creator_name, u.email as creator_email
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        WHERE h.id = ?
      `, [updateId]);
      
      res.json({ update });
    } catch (error) {
      console.error('Error updating HSE update:', error);
      res.status(500).json({ error: 'Failed to update HSE update' });
    }
  }

  // Acknowledge HSE update
  static async acknowledgeHseUpdate(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      const { comments, signature, understood } = req.body;
      
      // Check if update exists and requires acknowledgment
      const update = await dbGet(`
        SELECT * FROM hse_updates 
        WHERE id = ? AND requires_acknowledgment = true AND is_active = true
      `, [updateId]);
      
      if (!update) {
        return res.status(404).json({ 
          error: 'HSE update not found or does not require acknowledgment' 
        });
      }
      
      // Check if already acknowledged
      const existing = await dbGet(`
        SELECT * FROM hse_acknowledgments 
        WHERE hse_update_id = ? AND user_id = ?
      `, [updateId, req.user!.id]);
      
      if (existing) {
        return res.status(400).json({ 
          error: 'You have already acknowledged this update',
          acknowledgment: existing 
        });
      }
      
      // Check if past deadline
      if (update.acknowledgment_deadline && 
          new Date(update.acknowledgment_deadline) < new Date()) {
        return res.status(400).json({ 
          error: 'Acknowledgment deadline has passed' 
        });
      }
      
      // Create acknowledgment
      await dbRun(`
        INSERT INTO hse_acknowledgments (
          hse_update_id, user_id, comments, signature, 
          understood, ip_address, user_agent
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        updateId,
        req.user!.id,
        comments || null,
        signature || null,
        understood !== false, // Default to true
        req.ip,
        req.headers['user-agent'] || null
      ]);
      
      res.json({ 
        message: 'HSE update acknowledged successfully',
        acknowledgedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error acknowledging HSE update:', error);
      res.status(500).json({ error: 'Failed to acknowledge HSE update' });
    }
  }

  // Get acknowledgment statistics
  static async getAcknowledgmentStats(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      
      // Check permissions
      if (!HseService.canViewAcknowledgments(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to view acknowledgment statistics' 
        });
      }
      
      // Get update details
      const update = await dbGet(`
        SELECT * FROM hse_updates WHERE id = ?
      `, [updateId]);
      
      if (!update) {
        return res.status(404).json({ error: 'HSE update not found' });
      }
      
      const stats = await HseService.getAcknowledgmentStats(updateId, update);
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting acknowledgment stats:', error);
      res.status(500).json({ error: 'Failed to get acknowledgment statistics' });
    }
  }

  // Get non-acknowledged users
  static async getNonAcknowledgedUsers(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      
      // Check permissions
      if (!HseService.canViewAcknowledgments(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to view this information' 
        });
      }
      
      // Get update details
      const update = await dbGet(`
        SELECT * FROM hse_updates WHERE id = ?
      `, [updateId]);
      
      if (!update) {
        return res.status(404).json({ error: 'HSE update not found' });
      }
      
      const nonAcknowledgedUsers = await HseService.getNonAcknowledgedUsers(updateId, update);
      
      res.json({ 
        users: nonAcknowledgedUsers,
        total: nonAcknowledgedUsers.length 
      });
    } catch (error) {
      console.error('Error getting non-acknowledged users:', error);
      res.status(500).json({ error: 'Failed to get non-acknowledged users' });
    }
  }

  // Send reminder for acknowledgment
  static async sendAcknowledgmentReminder(req: AuthRequest, res: Response) {
    try {
      const updateId = parseInt(req.params.updateId);
      const { user_ids, message } = req.body;
      
      // Check permissions
      if (!['hse', 'hse_manager', 'admin'].includes(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to send reminders' 
        });
      }
      
      // Get update
      const update = await dbGet(`
        SELECT h.*, u.name as creator_name
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        WHERE h.id = ? AND h.requires_acknowledgment = true
      `, [updateId]);
      
      if (!update) {
        return res.status(404).json({ 
          error: 'HSE update not found or does not require acknowledgment' 
        });
      }
      
      // Send reminders
      const results = await NotificationService.sendHseAcknowledgmentReminders(
        update, 
        user_ids || await HseService.getNonAcknowledgedUserIds(updateId, update),
        message,
        req.user!
      );
      
      res.json({ 
        message: 'Reminders sent successfully',
        sentTo: results.successful,
        failed: results.failed
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      res.status(500).json({ error: 'Failed to send acknowledgment reminders' });
    }
  }

  // Get HSE statistics
  static async getHseStatistics(req: AuthRequest, res: Response) {
    try {
      const { period = '30', vessel_id, department } = req.query;
      
      // Check permissions
      if (!['hse', 'hse_manager', 'admin', 'manager'].includes(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to view HSE statistics' 
        });
      }
      
      const stats = await HseService.getStatistics({
        period: parseInt(period as string),
        vessel_id: vessel_id as string,
        department: department as string,
        user: req.user!
      });
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting HSE statistics:', error);
      res.status(500).json({ error: 'Failed to get HSE statistics' });
    }
  }

  // Export HSE updates report
  static async exportHseReport(req: AuthRequest, res: Response) {
    try {
      const { format = 'csv', ...filters } = req.query;
      
      // Check permissions
      if (!['hse', 'hse_manager', 'admin'].includes(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to export HSE reports' 
        });
      }
      
      const report = await HseService.generateReport({
        format: format as string,
        filters,
        user: req.user!
      });
      
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.data);
    } catch (error) {
      console.error('Error exporting HSE report:', error);
      res.status(500).json({ error: 'Failed to export HSE report' });
    }
  }
}