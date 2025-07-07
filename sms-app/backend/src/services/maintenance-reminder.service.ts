import { dbAll, dbRun } from '../config/database.abstraction';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

export class MaintenanceReminderService {
  // Check and send maintenance reminders
  static async checkAndSendMaintenanceReminders(): Promise<void> {
    try {
      // Get equipment with maintenance due in different time ranges
      const maintenanceReminders = await this.getUpcomingMaintenance();
      
      for (const reminder of maintenanceReminders) {
        await this.sendMaintenanceNotification(reminder);
        await this.updateMaintenanceNotificationSent(reminder.id, reminder.days_until_due);
      }

      console.log(`✅ Processed ${maintenanceReminders.length} maintenance reminders`);
    } catch (error) {
      console.error('❌ Failed to check maintenance reminders:', error);
    }
  }

  // Get equipment with upcoming maintenance
  private static async getUpcomingMaintenance(): Promise<any[]> {
    return await dbAll(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.manufacturer,
        e.model,
        e.serial_number,
        e.location,
        e.criticality,
        e.next_maintenance_date,
        e.maintenance_interval_days,
        e.vessel_id,
        v.name as vessel_name,
        v.company_id,
        c.name as company_name,
        CAST(julianday(e.next_maintenance_date) - julianday('now') AS INTEGER) as days_until_due,
        CASE
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 0 THEN 'overdue'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 3 THEN '3_days'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 7 THEN '7_days'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 14 THEN '14_days'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 30 THEN '30_days'
          ELSE 'future'
        END as reminder_type,
        COALESCE(
          (SELECT sent_at FROM maintenance_reminders 
           WHERE equipment_id = e.id 
           AND reminder_type = CASE
             WHEN julianday(e.next_maintenance_date) - julianday('now') <= 0 THEN 'overdue'
             WHEN julianday(e.next_maintenance_date) - julianday('now') <= 3 THEN '3_days'
             WHEN julianday(e.next_maintenance_date) - julianday('now') <= 7 THEN '7_days'
             WHEN julianday(e.next_maintenance_date) - julianday('now') <= 14 THEN '14_days'
             WHEN julianday(e.next_maintenance_date) - julianday('now') <= 30 THEN '30_days'
           END
           ORDER BY sent_at DESC LIMIT 1
          ), 
          NULL
        ) as last_reminder_sent
      FROM equipment e
      JOIN vessels v ON e.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE e.next_maintenance_date IS NOT NULL
        AND e.status != 'decommissioned'
        AND julianday(e.next_maintenance_date) - julianday('now') <= 30
        AND (
          last_reminder_sent IS NULL 
          OR julianday('now') - julianday(last_reminder_sent) >= 1
        )
      ORDER BY days_until_due ASC
    `);
  }

  // Send maintenance notification
  private static async sendMaintenanceNotification(reminder: any): Promise<void> {
    const priority = reminder.days_until_due <= 0 ? 'urgent' :
                    reminder.days_until_due <= 7 ? 'high' : 
                    reminder.days_until_due <= 14 ? 'normal' : 'low';

    const channels = reminder.days_until_due <= 7 ? ['in_app', 'email', 'push'] : ['in_app', 'email'];

    // Get relevant users based on vessel and role
    const users = await dbAll(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.notify_maintenance_reminders
      FROM users u
      WHERE u.is_active = true
        AND u.notify_maintenance_reminders = true
        AND (
          (u.default_vessel_id = ? AND u.role IN ('chief_engineer', 'second_engineer', 'third_engineer', 'technician'))
          OR (u.company_id = ? AND u.role IN ('manager', 'admin'))
        )
    `, [reminder.vessel_id, reminder.company_id]);

    const title = reminder.days_until_due <= 0 
      ? `OVERDUE: Maintenance Required - ${reminder.equipment_name}`
      : `Maintenance Due: ${reminder.equipment_name} - ${reminder.days_until_due} days`;

    const message = this.buildMaintenanceMessage(reminder);

    // Send notifications to all relevant users
    for (const user of users) {
      await NotificationService.sendNotification({
        userId: user.id,
        type: 'maintenance_reminder',
        title,
        message,
        data: {
          equipmentId: reminder.id,
          equipmentName: reminder.equipment_name,
          vesselName: reminder.vessel_name,
          daysUntilDue: reminder.days_until_due,
          dueDate: reminder.next_maintenance_date,
          criticality: reminder.criticality,
          link: `/equipment/${reminder.id}/maintenance`
        },
        priority,
        channels
      });
    }
  }

  // Build maintenance message
  private static buildMaintenanceMessage(reminder: any): string {
    const dueDate = new Date(reminder.next_maintenance_date).toLocaleDateString();
    
    if (reminder.days_until_due <= 0) {
      return `Maintenance for ${reminder.equipment_name} (${reminder.location}) on ${reminder.vessel_name} is OVERDUE. This ${reminder.criticality} criticality equipment was due on ${dueDate}. Immediate action required.`;
    } else {
      return `${reminder.equipment_name} (${reminder.location}) on ${reminder.vessel_name} requires maintenance in ${reminder.days_until_due} days (Due: ${dueDate}). Equipment criticality: ${reminder.criticality}.`;
    }
  }

  // Update maintenance notification sent record
  private static async updateMaintenanceNotificationSent(equipmentId: number, daysUntilDue: number): Promise<void> {
    const reminderType = daysUntilDue <= 0 ? 'overdue' :
                        daysUntilDue <= 3 ? '3_days' :
                        daysUntilDue <= 7 ? '7_days' :
                        daysUntilDue <= 14 ? '14_days' : '30_days';

    // First ensure the table exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS maintenance_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL REFERENCES equipment(id),
        reminder_type VARCHAR(20) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(equipment_id, reminder_type, date(sent_at))
      )
    `).catch(() => {
      // Table might already exist
    });

    await dbRun(`
      INSERT OR REPLACE INTO maintenance_reminders (equipment_id, reminder_type, sent_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [equipmentId, reminderType]);
  }

  // Get maintenance statistics for dashboard
  static async getMaintenanceStatistics(vesselId?: number): Promise<any> {
    let baseQuery = `
      SELECT 
        COUNT(*) as total_equipment,
        COUNT(CASE WHEN next_maintenance_date IS NOT NULL THEN 1 END) as scheduled_maintenance,
        COUNT(CASE WHEN julianday(next_maintenance_date) - julianday('now') <= 0 THEN 1 END) as overdue,
        COUNT(CASE WHEN julianday(next_maintenance_date) - julianday('now') BETWEEN 0 AND 7 THEN 1 END) as due_this_week,
        COUNT(CASE WHEN julianday(next_maintenance_date) - julianday('now') BETWEEN 7 AND 30 THEN 1 END) as due_this_month,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as currently_in_maintenance
      FROM equipment
      WHERE status != 'decommissioned'
    `;

    const params: any[] = [];
    if (vesselId) {
      baseQuery += ` AND vessel_id = ?`;
      params.push(vesselId);
    }

    const stats = await dbAll(baseQuery, params);

    // Get upcoming maintenance list
    let upcomingQuery = `
      SELECT 
        e.id,
        e.name,
        e.location,
        e.criticality,
        e.next_maintenance_date,
        v.name as vessel_name,
        CAST(julianday(e.next_maintenance_date) - julianday('now') AS INTEGER) as days_until_due
      FROM equipment e
      JOIN vessels v ON e.vessel_id = v.id
      WHERE e.next_maintenance_date IS NOT NULL
        AND e.status != 'decommissioned'
        AND julianday(e.next_maintenance_date) - julianday('now') <= 30
    `;

    if (vesselId) {
      upcomingQuery += ` AND e.vessel_id = ?`;
    }

    upcomingQuery += ` ORDER BY e.next_maintenance_date ASC LIMIT 10`;

    const upcoming = await dbAll(upcomingQuery, params);

    return {
      statistics: stats[0],
      upcomingMaintenance: upcoming
    };
  }

  // Get maintenance calendar events
  static async getMaintenanceCalendarEvents(startDate: string, endDate: string, vesselId?: number): Promise<any[]> {
    let query = `
      SELECT 
        e.id as equipment_id,
        e.name as equipment_name,
        e.location,
        e.criticality,
        e.next_maintenance_date as event_date,
        v.id as vessel_id,
        v.name as vessel_name,
        'maintenance_due' as event_type,
        CASE 
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 0 THEN '#dc3545'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 7 THEN '#fd7e14'
          WHEN julianday(e.next_maintenance_date) - julianday('now') <= 14 THEN '#ffc107'
          ELSE '#0dcaf0'
        END as event_color
      FROM equipment e
      JOIN vessels v ON e.vessel_id = v.id
      WHERE e.next_maintenance_date BETWEEN ? AND ?
        AND e.status != 'decommissioned'
    `;

    const params: any[] = [startDate, endDate];

    if (vesselId) {
      query += ` AND e.vessel_id = ?`;
      params.push(vesselId);
    }

    query += ` ORDER BY e.next_maintenance_date`;

    return await dbAll(query, params);
  }
}