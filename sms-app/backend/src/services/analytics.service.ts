import { query } from '../config/database';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';

export class AnalyticsService {
  // Calculate vessel analytics
  static async calculateVesselAnalytics(vesselId: number, date: Date = new Date()) {
    try {
      const analyticsDate = startOfDay(date);
      const endDate = endOfDay(date);
      const startDate = subDays(analyticsDate, 30); // 30-day window

      // Get equipment statistics
      const equipmentStats = await query(`
        SELECT 
          COUNT(*) as total_equipment,
          COUNT(CASE WHEN status = 'operational' THEN 1 END) as operational_equipment
        FROM equipment
        WHERE vessel_id = $1 AND status != 'decommissioned'
      `, [vesselId]);

      // Calculate uptime percentage
      const uptimeData = await query(`
        SELECT 
          AVG(calculate_uptime_percentage(id, $2, $3)) as avg_uptime
        FROM equipment
        WHERE vessel_id = $1 AND status != 'decommissioned'
      `, [vesselId, startDate, endDate]);

      // Get fault metrics
      const faultMetrics = await query(`
        SELECT 
          COUNT(*) as total_faults,
          COUNT(CASE WHEN f.severity = 'critical' THEN 1 END) as critical_faults,
          AVG(CASE 
            WHEN f.resolved_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (f.resolved_date - f.reported_date))/3600 
          END) as avg_mttr_hours
        FROM faults f
        JOIN equipment e ON f.equipment_id = e.id
        WHERE e.vessel_id = $1 
        AND f.reported_date BETWEEN $2 AND $3
      `, [vesselId, startDate, endDate]);

      // Calculate MTBF (Mean Time Between Failures)
      const mtbfData = await query(`
        WITH equipment_faults AS (
          SELECT 
            e.id,
            COUNT(f.id) as fault_count,
            MIN(f.reported_date) as first_fault,
            MAX(f.reported_date) as last_fault
          FROM equipment e
          LEFT JOIN faults f ON e.id = f.equipment_id
          WHERE e.vessel_id = $1
          AND f.reported_date BETWEEN $2 AND $3
          GROUP BY e.id
          HAVING COUNT(f.id) > 1
        )
        SELECT 
          AVG(
            EXTRACT(EPOCH FROM (last_fault - first_fault))/3600 / (fault_count - 1)
          ) as avg_mtbf_hours
        FROM equipment_faults
      `, [vesselId, startDate, endDate]);

      // Get maintenance compliance
      const complianceData = await query(`
        SELECT 
          COALESCE(AVG(compliance_rate), 0) as avg_compliance_rate
        FROM maintenance_compliance
        WHERE vessel_id = $1
        AND year = EXTRACT(YEAR FROM $2)
        AND month = EXTRACT(MONTH FROM $2)
      `, [vesselId, date]);

      // Calculate preventive vs corrective ratio
      const maintenanceRatio = await query(`
        SELECT 
          COUNT(CASE WHEN maintenance_type = 'preventive' THEN 1 END)::NUMERIC /
          NULLIF(COUNT(CASE WHEN maintenance_type = 'corrective' THEN 1 END), 0) as ratio
        FROM maintenance_logs ml
        JOIN equipment e ON ml.equipment_id = e.id
        WHERE e.vessel_id = $1
        AND ml.performed_date BETWEEN $2 AND $3
      `, [vesselId, startDate, endDate]);

      // Get cost data
      const costData = await query(`
        SELECT 
          COALESCE(SUM(pu.total_cost), 0) as parts_cost,
          COALESCE(SUM(ml.hours_spent * 50), 0) as labor_cost -- Assuming $50/hour
        FROM maintenance_logs ml
        JOIN equipment e ON ml.equipment_id = e.id
        LEFT JOIN parts_used pu ON pu.maintenance_id = ml.id
        WHERE e.vessel_id = $1
        AND ml.performed_date BETWEEN $2 AND $3
      `, [vesselId, startDate, endDate]);

      // Calculate technician productivity
      const productivityData = await query(`
        SELECT 
          COUNT(DISTINCT ml.performed_by) as active_technicians,
          COUNT(*) as total_tasks
        FROM maintenance_logs ml
        JOIN equipment e ON ml.equipment_id = e.id
        WHERE e.vessel_id = $1
        AND ml.performed_date BETWEEN $2 AND $3
      `, [vesselId, startDate, endDate]);

      const productivity = productivityData.rows[0].active_technicians > 0 
        ? productivityData.rows[0].total_tasks / productivityData.rows[0].active_technicians / 30 
        : 0;

      // Get work order backlog
      const backlogData = await query(`
        SELECT COUNT(*) as backlog
        FROM faults f
        JOIN equipment e ON f.equipment_id = e.id
        WHERE e.vessel_id = $1
        AND f.status IN ('open', 'in_progress', 'pending_parts')
      `, [vesselId]);

      // Insert or update vessel analytics
      const analytics = {
        vessel_id: vesselId,
        analytics_date: analyticsDate,
        total_equipment: equipmentStats.rows[0].total_equipment,
        operational_equipment: equipmentStats.rows[0].operational_equipment,
        equipment_uptime_percentage: uptimeData.rows[0]?.avg_uptime || 0,
        total_faults_reported: faultMetrics.rows[0].total_faults,
        critical_faults: faultMetrics.rows[0].critical_faults,
        avg_mttr_hours: faultMetrics.rows[0].avg_mttr_hours || 0,
        avg_mtbf_hours: mtbfData.rows[0]?.avg_mtbf_hours || 0,
        maintenance_compliance_rate: complianceData.rows[0].avg_compliance_rate,
        preventive_vs_corrective_ratio: maintenanceRatio.rows[0]?.ratio || 0,
        maintenance_cost_total: costData.rows[0].labor_cost,
        parts_cost_total: costData.rows[0].parts_cost,
        technician_productivity: productivity,
        work_order_backlog: backlogData.rows[0].backlog
      };

      await query(`
        INSERT INTO vessel_analytics (
          vessel_id, analytics_date, total_equipment, operational_equipment,
          equipment_uptime_percentage, total_faults_reported, critical_faults,
          avg_mttr_hours, avg_mtbf_hours, maintenance_compliance_rate,
          preventive_vs_corrective_ratio, maintenance_cost_total, parts_cost_total,
          technician_productivity, work_order_backlog
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (vessel_id, analytics_date) 
        DO UPDATE SET
          total_equipment = EXCLUDED.total_equipment,
          operational_equipment = EXCLUDED.operational_equipment,
          equipment_uptime_percentage = EXCLUDED.equipment_uptime_percentage,
          total_faults_reported = EXCLUDED.total_faults_reported,
          critical_faults = EXCLUDED.critical_faults,
          avg_mttr_hours = EXCLUDED.avg_mttr_hours,
          avg_mtbf_hours = EXCLUDED.avg_mtbf_hours,
          maintenance_compliance_rate = EXCLUDED.maintenance_compliance_rate,
          preventive_vs_corrective_ratio = EXCLUDED.preventive_vs_corrective_ratio,
          maintenance_cost_total = EXCLUDED.maintenance_cost_total,
          parts_cost_total = EXCLUDED.parts_cost_total,
          technician_productivity = EXCLUDED.technician_productivity,
          work_order_backlog = EXCLUDED.work_order_backlog,
          updated_at = CURRENT_TIMESTAMP
      `, [
        analytics.vessel_id, analytics.analytics_date, analytics.total_equipment,
        analytics.operational_equipment, analytics.equipment_uptime_percentage,
        analytics.total_faults_reported, analytics.critical_faults,
        analytics.avg_mttr_hours, analytics.avg_mtbf_hours,
        analytics.maintenance_compliance_rate, analytics.preventive_vs_corrective_ratio,
        analytics.maintenance_cost_total, analytics.parts_cost_total,
        analytics.technician_productivity, analytics.work_order_backlog
      ]);

      return analytics;
    } catch (error) {
      console.error('Error calculating vessel analytics:', error);
      throw error;
    }
  }

  // Calculate technician metrics
  static async calculateTechnicianMetrics(userId: number, vesselId: number | null, startDate: Date, endDate: Date) {
    try {
      // Get fault resolution metrics
      const faultMetrics = await query(`
        SELECT 
          COUNT(*) as faults_assigned,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as faults_resolved,
          COUNT(CASE WHEN status = 'resolved' AND severity = 'critical' THEN 1 END) as critical_resolved,
          AVG(CASE 
            WHEN resolved_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_date - reported_date))/3600 
          END) as avg_resolution_hours,
          MIN(CASE 
            WHEN resolved_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_date - reported_date))/3600 
          END) as fastest_resolution
        FROM faults f
        ${vesselId ? 'JOIN equipment e ON f.equipment_id = e.id' : ''}
        WHERE f.assigned_to = $1
        AND f.reported_date BETWEEN $2 AND $3
        ${vesselId ? 'AND e.vessel_id = $4' : ''}
      `, vesselId ? [userId, startDate, endDate, vesselId] : [userId, startDate, endDate]);

      // Get maintenance metrics
      const maintenanceMetrics = await query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN maintenance_type = 'preventive' THEN 1 END) as preventive_tasks,
          COUNT(CASE WHEN maintenance_type = 'emergency' THEN 1 END) as emergency_tasks,
          COALESCE(SUM(hours_spent), 0) as total_hours
        FROM maintenance_logs ml
        ${vesselId ? 'JOIN equipment e ON ml.equipment_id = e.id' : ''}
        WHERE ml.performed_by = $1
        AND ml.performed_date BETWEEN $2 AND $3
        ${vesselId ? 'AND e.vessel_id = $4' : ''}
      `, vesselId ? [userId, startDate, endDate, vesselId] : [userId, startDate, endDate]);

      // Calculate efficiency score
      const efficiencyScore = await query(`
        SELECT calculate_technician_efficiency($1, $2, $3) as efficiency
      `, [userId, startDate, endDate]);

      // Get rework count (faults reopened after resolution)
      const reworkData = await query(`
        WITH fault_history AS (
          SELECT 
            f.id,
            f.status,
            LAG(f.status) OVER (PARTITION BY f.id ORDER BY f.updated_at) as prev_status
          FROM faults f
          WHERE f.assigned_to = $1
          AND f.reported_date BETWEEN $2 AND $3
        )
        SELECT COUNT(*) as rework_count
        FROM fault_history
        WHERE status IN ('open', 'in_progress') 
        AND prev_status = 'resolved'
      `, [userId, startDate, endDate]);

      // Calculate first-time fix rate
      const firstTimeFixRate = faultMetrics.rows[0].faults_resolved > 0
        ? ((faultMetrics.rows[0].faults_resolved - reworkData.rows[0].rework_count) / faultMetrics.rows[0].faults_resolved) * 100
        : 0;

      // Insert or update technician metrics
      const metrics = {
        user_id: userId,
        vessel_id: vesselId,
        period_start: startDate,
        period_end: endDate,
        faults_assigned: faultMetrics.rows[0].faults_assigned,
        faults_resolved: faultMetrics.rows[0].faults_resolved,
        critical_faults_resolved: faultMetrics.rows[0].critical_resolved,
        avg_resolution_time_hours: faultMetrics.rows[0].avg_resolution_hours || 0,
        fastest_resolution_hours: faultMetrics.rows[0].fastest_resolution || 0,
        maintenance_tasks_completed: maintenanceMetrics.rows[0].total_tasks,
        preventive_tasks_completed: maintenanceMetrics.rows[0].preventive_tasks,
        emergency_tasks_completed: maintenanceMetrics.rows[0].emergency_tasks,
        maintenance_hours_logged: maintenanceMetrics.rows[0].total_hours,
        efficiency_score: efficiencyScore.rows[0].efficiency,
        rework_count: reworkData.rows[0].rework_count,
        first_time_fix_rate: firstTimeFixRate
      };

      await query(`
        INSERT INTO technician_metrics (
          user_id, vessel_id, period_start, period_end,
          faults_assigned, faults_resolved, critical_faults_resolved,
          avg_resolution_time_hours, fastest_resolution_hours,
          maintenance_tasks_completed, preventive_tasks_completed,
          emergency_tasks_completed, maintenance_hours_logged,
          efficiency_score, rework_count, first_time_fix_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (user_id, vessel_id, period_start, period_end)
        DO UPDATE SET
          faults_assigned = EXCLUDED.faults_assigned,
          faults_resolved = EXCLUDED.faults_resolved,
          critical_faults_resolved = EXCLUDED.critical_faults_resolved,
          avg_resolution_time_hours = EXCLUDED.avg_resolution_time_hours,
          fastest_resolution_hours = EXCLUDED.fastest_resolution_hours,
          maintenance_tasks_completed = EXCLUDED.maintenance_tasks_completed,
          preventive_tasks_completed = EXCLUDED.preventive_tasks_completed,
          emergency_tasks_completed = EXCLUDED.emergency_tasks_completed,
          maintenance_hours_logged = EXCLUDED.maintenance_hours_logged,
          efficiency_score = EXCLUDED.efficiency_score,
          rework_count = EXCLUDED.rework_count,
          first_time_fix_rate = EXCLUDED.first_time_fix_rate,
          updated_at = CURRENT_TIMESTAMP
      `, [
        metrics.user_id, metrics.vessel_id, metrics.period_start, metrics.period_end,
        metrics.faults_assigned, metrics.faults_resolved, metrics.critical_faults_resolved,
        metrics.avg_resolution_time_hours, metrics.fastest_resolution_hours,
        metrics.maintenance_tasks_completed, metrics.preventive_tasks_completed,
        metrics.emergency_tasks_completed, metrics.maintenance_hours_logged,
        metrics.efficiency_score, metrics.rework_count, metrics.first_time_fix_rate
      ]);

      return metrics;
    } catch (error) {
      console.error('Error calculating technician metrics:', error);
      throw error;
    }
  }

  // Update maintenance compliance
  static async updateMaintenanceCompliance(vesselId: number, month: number, year: number) {
    try {
      // Get scheduled vs completed maintenance tasks
      const complianceData = await query(`
        WITH scheduled_maintenance AS (
          SELECT 
            e.id as equipment_id,
            e.next_maintenance_date,
            ml.performed_date,
            CASE 
              WHEN ml.performed_date <= e.next_maintenance_date THEN 'on_time'
              WHEN ml.performed_date > e.next_maintenance_date THEN 'late'
              ELSE 'missed'
            END as completion_status
          FROM equipment e
          LEFT JOIN maintenance_logs ml ON e.id = ml.equipment_id
            AND EXTRACT(MONTH FROM ml.performed_date) = $2
            AND EXTRACT(YEAR FROM ml.performed_date) = $3
          WHERE e.vessel_id = $1
          AND EXTRACT(MONTH FROM e.next_maintenance_date) = $2
          AND EXTRACT(YEAR FROM e.next_maintenance_date) = $3
        )
        SELECT 
          equipment_id,
          COUNT(*) as scheduled_tasks,
          COUNT(CASE WHEN completion_status = 'on_time' THEN 1 END) as completed_on_time,
          COUNT(CASE WHEN completion_status = 'late' THEN 1 END) as completed_late,
          COUNT(CASE WHEN completion_status = 'missed' THEN 1 END) as missed_tasks,
          AVG(CASE 
            WHEN completion_status = 'late' 
            THEN EXTRACT(DAY FROM (performed_date - next_maintenance_date))
          END) as avg_delay_days
        FROM scheduled_maintenance
        GROUP BY equipment_id
      `, [vesselId, month, year]);

      // Insert compliance data for each equipment
      for (const row of complianceData.rows) {
        const complianceRate = row.scheduled_tasks > 0
          ? ((row.completed_on_time + row.completed_late) / row.scheduled_tasks) * 100
          : 100;

        await query(`
          INSERT INTO maintenance_compliance (
            vessel_id, equipment_id, month, year,
            scheduled_tasks, completed_on_time, completed_late, missed_tasks,
            compliance_rate, avg_delay_days
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (vessel_id, equipment_id, month, year)
          DO UPDATE SET
            scheduled_tasks = EXCLUDED.scheduled_tasks,
            completed_on_time = EXCLUDED.completed_on_time,
            completed_late = EXCLUDED.completed_late,
            missed_tasks = EXCLUDED.missed_tasks,
            compliance_rate = EXCLUDED.compliance_rate,
            avg_delay_days = EXCLUDED.avg_delay_days,
            updated_at = CURRENT_TIMESTAMP
        `, [
          vesselId, row.equipment_id, month, year,
          row.scheduled_tasks, row.completed_on_time, row.completed_late,
          row.missed_tasks, complianceRate, row.avg_delay_days || 0
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error updating maintenance compliance:', error);
      throw error;
    }
  }

  // Get fleet analytics
  static async getFleetAnalytics(companyId: number) {
    try {
      const analytics = await query(`
        SELECT 
          v.id,
          v.name,
          va.equipment_uptime_percentage,
          va.avg_mttr_hours,
          va.maintenance_compliance_rate,
          va.total_faults_reported,
          va.critical_faults,
          va.work_order_backlog,
          va.maintenance_cost_total + va.parts_cost_total as total_cost
        FROM vessels v
        LEFT JOIN LATERAL (
          SELECT * FROM vessel_analytics
          WHERE vessel_id = v.id
          ORDER BY analytics_date DESC
          LIMIT 1
        ) va ON true
        WHERE v.company_id = $1
        AND v.is_active = true
      `, [companyId]);

      // Calculate fleet-wide metrics
      const fleetMetrics = await query(`
        SELECT 
          AVG(va.equipment_uptime_percentage) as avg_fleet_uptime,
          AVG(va.avg_mttr_hours) as avg_fleet_mttr,
          AVG(va.maintenance_compliance_rate) as avg_fleet_compliance,
          SUM(va.total_faults_reported) as total_fleet_faults,
          SUM(va.critical_faults) as total_critical_faults,
          SUM(va.work_order_backlog) as total_backlog,
          SUM(va.maintenance_cost_total + va.parts_cost_total) as total_fleet_cost
        FROM vessels v
        JOIN vessel_analytics va ON v.id = va.vessel_id
        WHERE v.company_id = $1
        AND v.is_active = true
        AND va.analytics_date = (
          SELECT MAX(analytics_date) FROM vessel_analytics WHERE vessel_id = v.id
        )
      `, [companyId]);

      return {
        vessels: analytics.rows,
        fleet: fleetMetrics.rows[0]
      };
    } catch (error) {
      console.error('Error getting fleet analytics:', error);
      throw error;
    }
  }

  // Get performance trends
  static async getPerformanceTrends(entityType: string, entityId: number, metricName: string, period: string = 'daily', days: number = 30) {
    try {
      const startDate = subDays(new Date(), days);

      const trends = await query(`
        SELECT 
          DATE_TRUNC($3, recorded_at) as period,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          COUNT(*) as data_points
        FROM performance_history
        WHERE entity_type = $1
        AND entity_id = $2
        AND metric_name = $4
        AND recorded_at >= $5
        GROUP BY period
        ORDER BY period ASC
      `, [entityType, entityId, period, metricName, startDate]);

      return trends.rows;
    } catch (error) {
      console.error('Error getting performance trends:', error);
      throw error;
    }
  }

  // Record performance metric
  static async recordPerformanceMetric(
    entityType: string,
    entityId: number,
    metricName: string,
    metricValue: number,
    metricUnit?: string,
    metadata?: any
  ) {
    try {
      await query(`
        INSERT INTO performance_history (
          entity_type, entity_id, metric_name, metric_value,
          metric_unit, recorded_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [entityType, entityId, metricName, metricValue, metricUnit, new Date(), metadata]);

      return true;
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw error;
    }
  }

  // Check and award technician achievements
  static async checkTechnicianAchievements(userId: number) {
    try {
      // Get technician's current metrics
      const currentMonth = startOfMonth(new Date());
      const metrics = await query(`
        SELECT * FROM technician_metrics
        WHERE user_id = $1
        AND period_start = $2
        ORDER BY period_end DESC
        LIMIT 1
      `, [userId, currentMonth]);

      if (metrics.rows.length === 0) return;

      const techMetrics = metrics.rows[0];
      const achievements = [];

      // Speed Demon - Resolved a critical fault in under 2 hours
      if (techMetrics.fastest_resolution_hours < 2 && techMetrics.critical_faults_resolved > 0) {
        achievements.push({
          type: 'speed',
          name: 'Speed Demon',
          description: 'Resolved a critical fault in under 2 hours'
        });
      }

      // Reliability Expert - 95%+ first-time fix rate
      if (techMetrics.first_time_fix_rate >= 95) {
        achievements.push({
          type: 'quality',
          name: 'Reliability Expert',
          description: 'Achieved 95% or higher first-time fix rate'
        });
      }

      // Efficiency Master - 90%+ efficiency score
      if (techMetrics.efficiency_score >= 90) {
        achievements.push({
          type: 'efficiency',
          name: 'Efficiency Master',
          description: 'Maintained 90% or higher efficiency score'
        });
      }

      // Critical Response Hero - Resolved 10+ critical faults
      if (techMetrics.critical_faults_resolved >= 10) {
        achievements.push({
          type: 'critical',
          name: 'Critical Response Hero',
          description: 'Resolved 10 or more critical faults in a month'
        });
      }

      // Award achievements
      for (const achievement of achievements) {
        await query(`
          INSERT INTO technician_achievements (
            user_id, achievement_type, achievement_name,
            achievement_description, earned_date
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, achievement_type, earned_date) DO NOTHING
        `, [userId, achievement.type, achievement.name, achievement.description, new Date()]);
      }

      return achievements;
    } catch (error) {
      console.error('Error checking technician achievements:', error);
      throw error;
    }
  }
}