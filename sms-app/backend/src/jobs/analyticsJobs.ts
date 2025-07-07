import * as cron from 'node-cron';
import { AnalyticsService } from '../services/analytics.service';
import { query } from '../config/database';
import { startOfMonth, endOfMonth } from 'date-fns';

class AnalyticsJobs {
  private dailyAnalyticsJob: cron.ScheduledTask | null = null;
  private hourlyMetricsJob: cron.ScheduledTask | null = null;
  private monthlyComplianceJob: cron.ScheduledTask | null = null;

  start() {
    // Daily analytics calculation at 2 AM
    this.dailyAnalyticsJob = cron.schedule('0 2 * * *', async () => {
      console.log('📊 Running daily analytics calculations...');
      await this.calculateDailyAnalytics();
    });

    // Hourly performance metrics
    this.hourlyMetricsJob = cron.schedule('0 * * * *', async () => {
      console.log('📈 Recording hourly performance metrics...');
      await this.recordHourlyMetrics();
    });

    // Monthly compliance calculation on the 1st at 3 AM
    this.monthlyComplianceJob = cron.schedule('0 3 1 * *', async () => {
      console.log('📋 Running monthly compliance calculations...');
      await this.calculateMonthlyCompliance();
    });

    console.log('✅ Analytics jobs scheduled');
  }

  stop() {
    if (this.dailyAnalyticsJob) {
      this.dailyAnalyticsJob.stop();
    }
    if (this.hourlyMetricsJob) {
      this.hourlyMetricsJob.stop();
    }
    if (this.monthlyComplianceJob) {
      this.monthlyComplianceJob.stop();
    }
    console.log('🛑 Analytics jobs stopped');
  }

  private async calculateDailyAnalytics() {
    try {
      // Get all active vessels
      const vessels = await query(`
        SELECT DISTINCT v.id, v.name
        FROM vessels v
        WHERE v.is_active = true
      `);

      for (const vessel of vessels.rows) {
        try {
          await AnalyticsService.calculateVesselAnalytics(vessel.id, new Date());
          console.log(`✅ Calculated analytics for vessel ${vessel.name}`);
        } catch (error) {
          console.error(`❌ Failed to calculate analytics for vessel ${vessel.name}:`, error);
        }
      }

      // Calculate technician metrics for the current month
      const currentMonth = startOfMonth(new Date());
      const endMonth = endOfMonth(new Date());

      const technicians = await query(`
        SELECT DISTINCT u.id, u.first_name, u.last_name
        FROM users u
        WHERE u.role IN ('technician', 'chief_engineer', 'second_engineer', 'third_engineer', 'fourth_engineer')
        AND u.is_active = true
      `);

      for (const tech of technicians.rows) {
        try {
          await AnalyticsService.calculateTechnicianMetrics(
            tech.id,
            null, // Calculate for all vessels
            currentMonth,
            endMonth
          );
          console.log(`✅ Calculated metrics for technician ${tech.first_name} ${tech.last_name}`);
          
          // Check for achievements
          await AnalyticsService.checkTechnicianAchievements(tech.id);
        } catch (error) {
          console.error(`❌ Failed to calculate metrics for technician ${tech.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in daily analytics calculation:', error);
    }
  }

  private async recordHourlyMetrics() {
    try {
      // Record equipment uptime metrics
      const equipmentStatus = await query(`
        SELECT 
          e.id,
          e.vessel_id,
          e.status,
          COUNT(*) OVER (PARTITION BY e.vessel_id) as total_equipment,
          COUNT(CASE WHEN e.status = 'operational' THEN 1 END) 
            OVER (PARTITION BY e.vessel_id) as operational_count
        FROM equipment e
        WHERE e.status != 'decommissioned'
      `);

      const vesselUptimes = new Map();
      
      for (const equipment of equipmentStatus.rows) {
        if (!vesselUptimes.has(equipment.vessel_id)) {
          const uptime = (equipment.operational_count / equipment.total_equipment) * 100;
          vesselUptimes.set(equipment.vessel_id, uptime);
          
          await AnalyticsService.recordPerformanceMetric(
            'vessel',
            equipment.vessel_id,
            'equipment_uptime',
            uptime,
            'percentage'
          );
        }
      }

      // Record active fault counts
      const faultCounts = await query(`
        SELECT 
          e.vessel_id,
          COUNT(f.id) as active_faults,
          COUNT(CASE WHEN f.severity = 'critical' THEN 1 END) as critical_faults
        FROM faults f
        JOIN equipment e ON f.equipment_id = e.id
        WHERE f.status IN ('open', 'in_progress', 'pending_parts')
        GROUP BY e.vessel_id
      `);

      for (const vessel of faultCounts.rows) {
        await AnalyticsService.recordPerformanceMetric(
          'vessel',
          vessel.vessel_id,
          'active_faults',
          vessel.active_faults,
          'count'
        );
        
        await AnalyticsService.recordPerformanceMetric(
          'vessel',
          vessel.vessel_id,
          'critical_faults',
          vessel.critical_faults,
          'count'
        );
      }

      console.log('✅ Hourly metrics recorded');
    } catch (error) {
      console.error('❌ Error recording hourly metrics:', error);
    }
  }

  private async calculateMonthlyCompliance() {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const year = currentDate.getFullYear();

      // Get all active vessels
      const vessels = await query(`
        SELECT id, name FROM vessels WHERE is_active = true
      `);

      for (const vessel of vessels.rows) {
        try {
          await AnalyticsService.updateMaintenanceCompliance(vessel.id, month, year);
          console.log(`✅ Updated compliance for vessel ${vessel.name}`);
        } catch (error) {
          console.error(`❌ Failed to update compliance for vessel ${vessel.name}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in monthly compliance calculation:', error);
    }
  }

  // Manual trigger for testing
  async runDailyAnalytics() {
    await this.calculateDailyAnalytics();
  }

  async runHourlyMetrics() {
    await this.recordHourlyMetrics();
  }

  async runMonthlyCompliance() {
    await this.calculateMonthlyCompliance();
  }
}

export const analyticsJobs = new AnalyticsJobs();