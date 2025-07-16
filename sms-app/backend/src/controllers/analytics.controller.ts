import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { query } from '../config/database';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

// Get vessel analytics
export const getVesselAnalytics = async (req: Request, res: Response) => {
  try {
    const { vesselId } = req.params;
    const { date } = req.query;
    
    const analyticsDate = date ? new Date(date as string) : new Date();
    
    // Check user has access to this vessel
    const hasAccess = await query(`
      SELECT 1 FROM vessels v
      JOIN users u ON u.company_id = v.company_id
      WHERE v.id = $1 AND u.id = $2
    `, [vesselId, req.user.id]);

    if (hasAccess.rows.length === 0) {
      return res.status(403).json({ 
        message: 'Access denied to this vessel' 
      });
    }

    // Get or calculate analytics
    let analytics = await query(`
      SELECT * FROM vessel_analytics
      WHERE vessel_id = $1
      AND analytics_date = $2
    `, [vesselId, startOfDay(analyticsDate)]);

    if (analytics.rows.length === 0) {
      // Calculate fresh analytics
      const calculated = await AnalyticsService.calculateVesselAnalytics(
        parseInt(vesselId),
        analyticsDate
      );
      analytics = { rows: [calculated] };
    }

    // Get recent trends (last 7 days)
    const trends = await query(`
      SELECT 
        analytics_date,
        equipment_uptime_percentage,
        avg_mttr_hours,
        total_faults_reported,
        maintenance_compliance_rate
      FROM vessel_analytics
      WHERE vessel_id = $1
      AND analytics_date >= $2
      ORDER BY analytics_date ASC
    `, [vesselId, subDays(analyticsDate, 7)]);

    // Get top issues
    const topIssues = await query(`
      SELECT 
        e.name as equipment_name,
        COUNT(f.id) as fault_count,
        AVG(EXTRACT(EPOCH FROM (f.resolved_date - f.reported_date))/3600) as avg_resolution_hours
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      WHERE e.vessel_id = $1
      AND f.reported_date >= $2
      GROUP BY e.id, e.name
      ORDER BY fault_count DESC
      LIMIT 5
    `, [vesselId, subDays(analyticsDate, 30)]);

    res.json({
      analytics: analytics.rows[0],
      trends: trends.rows,
      topIssues: topIssues.rows
    });
  } catch (error) {
    console.error('Error getting vessel analytics:', error);
    res.status(500).json({ 
      message: 'Failed to get vessel analytics' 
    });
  }
};

// Get technician analytics
export const getTechnicianAnalytics = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const { startDate, endDate, vesselId } = req.query;
    
    const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());
    
    // Check if requesting user is the technician or a manager
    const canView = req.user.id === parseInt(technicianId) || 
                   ['admin', 'manager', 'chief_engineer'].includes(req.user.role);
    
    if (!canView) {
      return res.status(403).json({ 
        message: 'Access denied to technician analytics' 
      });
    }

    // Get or calculate metrics
    let metrics = await query(`
      SELECT * FROM technician_metrics
      WHERE user_id = $1
      AND period_start = $2
      AND period_end = $3
      ${vesselId ? 'AND vessel_id = $4' : ''}
    `, vesselId ? [technicianId, start, end, vesselId] : [technicianId, start, end]);

    if (metrics.rows.length === 0) {
      // Calculate fresh metrics
      const calculated = await AnalyticsService.calculateTechnicianMetrics(
        parseInt(technicianId),
        vesselId ? parseInt(vesselId as string) : null,
        start,
        end
      );
      metrics = { rows: [calculated] };
    }

    // Get comparison with vessel average
    const vesselAverage = await query(`
      SELECT 
        AVG(efficiency_score) as avg_efficiency,
        AVG(avg_resolution_time_hours) as avg_resolution_time,
        AVG(first_time_fix_rate) as avg_fix_rate
      FROM technician_metrics
      WHERE vessel_id = $1
      AND period_start = $2
      AND period_end = $3
      AND user_id != $4
    `, [vesselId || metrics.rows[0].vessel_id, start, end, technicianId]);

    // Get recent achievements
    const achievements = await query(`
      SELECT * FROM technician_achievements
      WHERE user_id = $1
      ORDER BY earned_date DESC
      LIMIT 5
    `, [technicianId]);

    // Get performance history
    const history = await query(`
      SELECT 
        period_start,
        efficiency_score,
        faults_resolved,
        avg_resolution_time_hours
      FROM technician_metrics
      WHERE user_id = $1
      ORDER BY period_start DESC
      LIMIT 6
    `, [technicianId]);

    res.json({
      metrics: metrics.rows[0],
      comparison: {
        vessel_average: vesselAverage.rows[0],
        performance: {
          efficiency: metrics.rows[0].efficiency_score > (vesselAverage.rows[0]?.avg_efficiency || 0) ? 'above' : 'below',
          resolution_time: metrics.rows[0].avg_resolution_time_hours < (vesselAverage.rows[0]?.avg_resolution_time || 999) ? 'better' : 'worse',
          fix_rate: metrics.rows[0].first_time_fix_rate > (vesselAverage.rows[0]?.avg_fix_rate || 0) ? 'above' : 'below'
        }
      },
      achievements: achievements.rows,
      history: history.rows
    });
  } catch (error) {
    console.error('Error getting technician analytics:', error);
    res.status(500).json({ 
      message: 'Failed to get technician analytics' 
    });
  }
};

// Get fleet analytics
export const getFleetAnalytics = async (req: Request, res: Response) => {
  try {
    // Only managers and admins can view fleet analytics
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied to fleet analytics' 
      });
    }

    const analytics = await AnalyticsService.getFleetAnalytics(req.user.companyId);

    // Get additional fleet-wide stats
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT f.id) as active_faults,
        COUNT(DISTINCT CASE WHEN f.severity = 'critical' THEN f.id END) as critical_faults,
        COUNT(DISTINCT CASE WHEN f.severity = 'high' THEN f.id END) as high_faults,
        COUNT(DISTINCT CASE WHEN f.severity = 'medium' THEN f.id END) as medium_faults,
        COUNT(DISTINCT CASE WHEN f.severity = 'low' THEN f.id END) as low_faults,
        COUNT(DISTINCT CASE WHEN f.status = 'resolved' AND f.resolved_date >= CURRENT_DATE - INTERVAL '30 days' THEN f.id END) as resolved_last_30
      FROM faults f
      JOIN equipment e ON f.equipment_id = e.id
      JOIN vessels v ON e.vessel_id = v.id
      WHERE v.company_id = $1
      AND f.status IN ('open', 'in_progress', 'pending_parts')
    `, [req.user.companyId]);

    // Get maintenance stats
    const maintenanceStats = await query(`
      SELECT 
        COUNT(DISTINCT ml.id) as completed_last_30,
        COUNT(DISTINCT e.id) FILTER (WHERE e.next_maintenance_date < CURRENT_DATE) as overdue,
        COUNT(DISTINCT e.id) FILTER (WHERE e.next_maintenance_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as due_this_week,
        SUM(pu.total_cost) as parts_cost_30d
      FROM vessels v
      JOIN equipment e ON e.vessel_id = v.id
      LEFT JOIN maintenance_logs ml ON ml.equipment_id = e.id 
        AND ml.performed_date >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN parts_used pu ON pu.maintenance_id = ml.id
      WHERE v.company_id = $1
      AND v.is_active = true
    `, [req.user.companyId]);

    // Get inventory value
    const inventoryValue = await query(`
      SELECT 
        COALESCE(SUM(quantity * unit_cost), 0) as total_value,
        COUNT(CASE WHEN quantity < minimum_quantity THEN 1 END) as low_stock_items
      FROM inventory_items
      WHERE company_id = $1
    `, [req.user.companyId]);

    res.json({
      fleet: analytics.fleet,
      vessels: analytics.vessels,
      faultStats: stats.rows[0],
      maintenanceStats: maintenanceStats.rows[0],
      inventory: inventoryValue.rows[0]
    });
  } catch (error) {
    console.error('Error getting fleet analytics:', error);
    res.status(500).json({ 
      message: 'Failed to get fleet analytics' 
    });
  }
};

// Get performance trends
export const getPerformanceTrends = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, metric } = req.params;
    const { period = 'daily', days = 30 } = req.query;

    // Validate access based on entity type
    if (entityType === 'vessel') {
      const hasAccess = await query(`
        SELECT 1 FROM vessels v
        JOIN users u ON u.company_id = v.company_id
        WHERE v.id = $1 AND u.id = $2
      `, [entityId, req.user.id]);

      if (hasAccess.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied' 
        });
      }
    }

    const trends = await AnalyticsService.getPerformanceTrends(
      entityType,
      parseInt(entityId),
      metric,
      period as string,
      parseInt(days as string)
    );

    res.json({ trends });
  } catch (error) {
    console.error('Error getting performance trends:', error);
    res.status(500).json({ 
      message: 'Failed to get performance trends' 
    });
  }
};

// Get real-time dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { role, companyId, id: userId } = req.user;

    let stats: any = {};

    if (role === 'manager' || role === 'admin') {
      // Get manager dashboard stats
      const fleetAnalytics = await AnalyticsService.getFleetAnalytics(companyId);
      
      // Active faults breakdown
      const faults = await query(`
        SELECT 
          COUNT(CASE WHEN f.severity = 'critical' THEN 1 END) as critical,
          COUNT(CASE WHEN f.severity IN ('low', 'medium') THEN 1 END) as minor,
          COUNT(CASE WHEN f.status = 'resolved' AND f.resolved_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as resolved
        FROM faults f
        JOIN equipment e ON f.equipment_id = e.id
        JOIN vessels v ON e.vessel_id = v.id
        WHERE v.company_id = $1
        AND f.status IN ('open', 'in_progress', 'pending_parts')
      `, [companyId]);

      // Maintenance stats
      const maintenance = await query(`
        SELECT 
          COUNT(DISTINCT e.id) FILTER (WHERE e.next_maintenance_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as scheduled,
          COUNT(DISTINCT e.id) FILTER (WHERE e.next_maintenance_date < CURRENT_DATE) as overdue,
          COUNT(DISTINCT ml.id) as completed
        FROM vessels v
        JOIN equipment e ON e.vessel_id = v.id
        LEFT JOIN maintenance_logs ml ON ml.equipment_id = e.id 
          AND ml.performed_date >= CURRENT_DATE - INTERVAL '90 days'
        WHERE v.company_id = $1
        AND v.is_active = true
      `, [companyId]);

      // Inventory stats
      const inventory = await query(`
        SELECT 
          COUNT(CASE WHEN quantity < minimum_quantity THEN 1 END) as lowStock,
          COUNT(DISTINCT po.id) as pendingOrders,
          COALESCE(SUM(quantity * unit_cost), 0) as totalValue
        FROM inventory_items i
        LEFT JOIN purchase_orders po ON po.company_id = i.company_id 
          AND po.status = 'pending'
        WHERE i.company_id = $1
        GROUP BY i.company_id
      `, [companyId]);

      stats = {
        activeFaults: faults.rows[0] || { critical: 0, minor: 0, resolved: 0 },
        maintenance: maintenance.rows[0] || { scheduled: 0, overdue: 0, completed: 0 },
        inventory: inventory.rows[0] || { lowStock: 0, pendingOrders: 0, totalValue: 0 },
        performance: {
          mttr: fleetAnalytics.fleet?.avg_fleet_mttr || 0,
          uptime: fleetAnalytics.fleet?.avg_fleet_uptime || 0,
          efficiency: fleetAnalytics.fleet?.avg_fleet_compliance || 0
        }
      };
    } else if (role === 'technician' || role.includes('engineer')) {
      // Get technician dashboard stats
      const currentMonth = startOfMonth(new Date());
      const techMetrics = await AnalyticsService.calculateTechnicianMetrics(
        userId,
        null,
        currentMonth,
        endOfMonth(new Date())
      );

      stats = {
        myTasks: {
          assigned: techMetrics.faults_assigned,
          resolved: techMetrics.faults_resolved,
          efficiency: techMetrics.efficiency_score
        },
        maintenanceTasks: {
          completed: techMetrics.maintenance_tasks_completed,
          hoursLogged: techMetrics.maintenance_hours_logged
        }
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to get dashboard stats' 
    });
  }
};

// Update equipment status (for uptime tracking)
export const updateEquipmentStatus = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const { status, reason } = req.body;
    
    // Get previous status
    const previousStatus = await query(`
      SELECT status FROM equipment WHERE id = $1
    `, [equipmentId]);

    if (previousStatus.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Equipment not found' 
      });
    }

    const oldStatus = previousStatus.rows[0].status;

    // Update equipment status
    await query(`
      UPDATE equipment 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, equipmentId]);

    // Log status change for uptime tracking
    let downtimeMinutes = 0;
    
    if (oldStatus === 'operational' && status !== 'operational') {
      // Equipment going down - start tracking downtime
      await query(`
        INSERT INTO equipment_status_log (
          equipment_id, status, status_changed_at, changed_by, reason
        ) VALUES ($1, $2, $3, $4, $5)
      `, [equipmentId, status, new Date(), req.user.id, reason]);
    } else if (oldStatus !== 'operational' && status === 'operational') {
      // Equipment coming back online - calculate downtime
      const lastDowntime = await query(`
        SELECT status_changed_at FROM equipment_status_log
        WHERE equipment_id = $1
        AND status != 'operational'
        ORDER BY status_changed_at DESC
        LIMIT 1
      `, [equipmentId]);

      if (lastDowntime.rows.length > 0) {
        downtimeMinutes = Math.floor(
          (new Date().getTime() - new Date(lastDowntime.rows[0].status_changed_at).getTime()) / 60000
        );
      }

      await query(`
        INSERT INTO equipment_status_log (
          equipment_id, status, status_changed_at, changed_by, reason, downtime_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [equipmentId, status, new Date(), req.user.id, reason, downtimeMinutes]);
    }

    // Record performance metric
    await AnalyticsService.recordPerformanceMetric(
      'equipment',
      parseInt(equipmentId),
      'status_change',
      status === 'operational' ? 1 : 0,
      'status',
      { from: oldStatus, to: status, downtime_minutes: downtimeMinutes }
    );

    res.json({ 
      message: 'Equipment status updated',
      downtimeMinutes 
    });
  } catch (error) {
    console.error('Error updating equipment status:', error);
    res.status(500).json({ 
      message: 'Failed to update equipment status' 
    });
  }
};