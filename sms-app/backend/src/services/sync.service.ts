import { EventEmitter } from 'events';
import axios from 'axios';
import * as cron from 'node-cron';
import { dbRun, dbGet, dbAll } from '../config/database.abstraction';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Sync event types
export enum SyncEvent {
  SYNC_STARTED = 'sync:started',
  SYNC_COMPLETED = 'sync:completed',
  SYNC_FAILED = 'sync:failed',
  SYNC_PROGRESS = 'sync:progress',
  VESSEL_SYNCED = 'sync:vessel',
  EQUIPMENT_SYNCED = 'sync:equipment',
  USER_SYNCED = 'sync:user'
}

// Sync status types
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type SyncDirection = 'onboarding_to_maintenance' | 'maintenance_to_onboarding';
export type SyncType = 'manual' | 'scheduled' | 'webhook' | 'real_time';

// Sync result interface
export interface SyncResult {
  id: string;
  type: SyncType;
  direction: SyncDirection;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  itemsSynced: {
    vessels: number;
    equipment: number;
    users: number;
    parts: number;
    documents: number;
    maintenanceTasks: number;
  };
  errors: string[];
  metadata?: any;
}

// Sync service configuration
export interface SyncConfig {
  onboardingApiUrl: string;
  onboardingApiKey: string;
  enableRealTimeSync: boolean;
  enableScheduledSync: boolean;
  scheduleCron: string; // Default: '0 */4 * * *' (every 4 hours)
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
}

class SyncService extends EventEmitter {
  private config: SyncConfig;
  private scheduledJob: cron.ScheduledTask | null = null;
  private isSyncing: boolean = false;
  private currentSyncId: string | null = null;

  constructor(config: Partial<SyncConfig> = {}) {
    super();
    this.config = {
      onboardingApiUrl: process.env.ONBOARDING_API_URL || 'http://localhost:3001/api',
      onboardingApiKey: process.env.ONBOARDING_API_KEY || '',
      enableRealTimeSync: config.enableRealTimeSync ?? true,
      enableScheduledSync: config.enableScheduledSync ?? true,
      scheduleCron: config.scheduleCron || '0 */4 * * *',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      batchSize: config.batchSize || 100
    };

    // Initialize scheduled sync if enabled
    if (this.config.enableScheduledSync) {
      this.initializeScheduledSync();
    }
  }

  // Initialize scheduled sync job
  private initializeScheduledSync() {
    if (this.scheduledJob) {
      this.scheduledJob.stop();
    }

    this.scheduledJob = cron.schedule(this.config.scheduleCron, async () => {
      console.log('Running scheduled sync...');
      await this.syncAll('scheduled');
    });

    console.log(`Scheduled sync initialized with cron: ${this.config.scheduleCron}`);
  }

  // Main sync method - syncs all data from onboarding to maintenance
  async syncAll(type: SyncType = 'manual'): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.currentSyncId = uuidv4();

    const result: SyncResult = {
      id: this.currentSyncId,
      type,
      direction: 'onboarding_to_maintenance',
      status: 'in_progress',
      startedAt: new Date(),
      itemsSynced: {
        vessels: 0,
        equipment: 0,
        users: 0,
        parts: 0,
        documents: 0,
        maintenanceTasks: 0
      },
      errors: []
    };

    // Create sync record
    await this.createSyncRecord(result);

    try {
      this.emit(SyncEvent.SYNC_STARTED, result);

      // 1. Sync companies and vessels
      await this.syncVessels(result);

      // 2. Sync users
      await this.syncUsers(result);

      // 3. Sync equipment and parts
      await this.syncEquipment(result);

      // 4. Update sync status
      result.status = 'completed';
      result.completedAt = new Date();

      await this.updateSyncRecord(result);
      this.emit(SyncEvent.SYNC_COMPLETED, result);

    } catch (error) {
      result.status = 'failed';
      result.completedAt = new Date();
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');

      await this.updateSyncRecord(result);
      this.emit(SyncEvent.SYNC_FAILED, result);

      throw error;
    } finally {
      this.isSyncing = false;
      this.currentSyncId = null;
    }

    return result;
  }

  // Sync vessels from onboarding portal
  private async syncVessels(result: SyncResult) {
    try {
      const response = await this.makeApiRequest('/sync/vessels', 'GET');
      const vessels = response.data;

      for (const vesselData of vessels) {
        await this.syncSingleVessel(vesselData);
        result.itemsSynced.vessels++;
        this.emit(SyncEvent.SYNC_PROGRESS, { 
          type: 'vessel', 
          current: result.itemsSynced.vessels, 
          total: vessels.length 
        });
      }

    } catch (error) {
      const errorMsg = `Failed to sync vessels: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Sync a single vessel
  private async syncSingleVessel(vesselData: any) {
    const transaction = await dbRun('BEGIN TRANSACTION');

    try {
      // 1. Ensure company exists
      let company = await dbGet(
        'SELECT id FROM companies WHERE name = ?',
        [vesselData.company.name]
      );

      if (!company) {
        await dbRun(
          `INSERT INTO companies (name, contact_email, is_active) VALUES (?, ?, ?)`,
          [vesselData.company.name, vesselData.company.contactEmail, true]
        );
        company = await dbGet('SELECT id FROM companies WHERE name = ?', [vesselData.company.name]);
      }

      // 2. Check if vessel exists
      let vessel = await dbGet(
        'SELECT id FROM vessels WHERE imo_number = ?',
        [vesselData.imoNumber]
      );

      if (!vessel) {
        // Create new vessel
        await dbRun(
          `INSERT INTO vessels (
            company_id, name, imo_number, flag, vessel_type, 
            build_year, gross_tonnage, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            company.id,
            vesselData.name,
            vesselData.imoNumber,
            vesselData.flag,
            vesselData.vesselType,
            vesselData.yearBuilt,
            vesselData.grossTonnage,
            vesselData.isActive
          ]
        );
      } else {
        // Update existing vessel
        await dbRun(
          `UPDATE vessels SET 
            name = ?, flag = ?, vessel_type = ?, 
            build_year = ?, gross_tonnage = ?, is_active = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            vesselData.name,
            vesselData.flag,
            vesselData.vesselType,
            vesselData.yearBuilt,
            vesselData.grossTonnage,
            vesselData.isActive,
            vessel.id
          ]
        );
      }

      await dbRun('COMMIT');
      this.emit(SyncEvent.VESSEL_SYNCED, { vessel: vesselData });

    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  }

  // Sync users from onboarding portal
  private async syncUsers(result: SyncResult) {
    try {
      const response = await this.makeApiRequest('/sync/users', 'GET');
      const users = response.data;

      for (const userData of users) {
        await this.syncSingleUser(userData);
        result.itemsSynced.users++;
        this.emit(SyncEvent.SYNC_PROGRESS, { 
          type: 'user', 
          current: result.itemsSynced.users, 
          total: users.length 
        });
      }

    } catch (error) {
      const errorMsg = `Failed to sync users: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Sync a single user
  private async syncSingleUser(userData: any) {
    try {
      // Get company
      const company = await dbGet(
        'SELECT id FROM companies WHERE name = ?',
        [userData.company.name]
      );

      if (!company) {
        console.warn(`Company not found for user ${userData.email}, skipping...`);
        return;
      }

      // Check if user exists
      const existingUser = await dbGet(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );

      const mappedRole = this.mapUserRole(userData.role);

      if (existingUser) {
        // Update existing user
        await dbRun(
          `UPDATE users SET 
            first_name = ?, last_name = ?, role = ?, 
            phone_number = ?, is_active = ?,
            last_login = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            userData.firstName,
            userData.lastName,
            mappedRole,
            userData.phone,
            userData.isActive,
            userData.lastLoginAt,
            existingUser.id
          ]
        );
      } else {
        // Create new user with synced password hash and set first login flag
        await dbRun(
          `INSERT INTO users (
            company_id, username, email, password_hash, 
            first_name, last_name, role, phone_number, is_active,
            is_first_login, maintenance_status_complete
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            company.id,
            userData.email.split('@')[0], // Use email prefix as username
            userData.email,
            userData.passwordHash || await bcrypt.hash('TempPassword123!', 10),
            userData.firstName,
            userData.lastName,
            mappedRole,
            userData.phone,
            userData.isActive,
            true, // is_first_login
            false // maintenance_status_complete
          ]
        );
      }

      this.emit(SyncEvent.USER_SYNCED, { user: userData });

    } catch (error) {
      console.error(`Failed to sync user ${userData.email}:`, error);
      throw error;
    }
  }

  // Sync equipment from onboarding portal
  private async syncEquipment(result: SyncResult) {
    try {
      const response = await this.makeApiRequest('/sync/equipment', 'GET');
      const equipment = response.data;

      // Process in batches
      const batches = this.createBatches(equipment, this.config.batchSize);
      
      for (const batch of batches) {
        await this.syncEquipmentBatch(batch, result);
      }

    } catch (error) {
      const errorMsg = `Failed to sync equipment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Sync a batch of equipment
  private async syncEquipmentBatch(equipmentBatch: any[], result: SyncResult) {
    const transaction = await dbRun('BEGIN TRANSACTION');

    try {
      for (const equipmentData of equipmentBatch) {
        await this.syncSingleEquipment(equipmentData, result);
      }
      await dbRun('COMMIT');
    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  }

  // Sync a single equipment item
  private async syncSingleEquipment(equipmentData: any, result: SyncResult) {
    try {
      // Get vessel
      const vessel = await dbGet(
        'SELECT id FROM vessels WHERE imo_number = ?',
        [equipmentData.vessel.imoNumber]
      );

      if (!vessel) {
        console.warn(`Vessel not found for equipment ${equipmentData.name}, skipping...`);
        return;
      }

      // Generate QR code if not provided
      const qrCode = equipmentData.code || this.generateQRCode(equipmentData.name);

      // Check if equipment exists
      const existingEquipment = await dbGet(
        'SELECT id FROM equipment WHERE qr_code = ?',
        [qrCode]
      );

      const equipmentValues = [
        equipmentData.name,
        equipmentData.description,
        equipmentData.manufacturer,
        equipmentData.model,
        equipmentData.serialNumber,
        equipmentData.location?.name || 'Unknown',
        'PERMANENT',
        equipmentData.equipmentType || 'general',
        this.mapEquipmentStatus(equipmentData.status),
        equipmentData.installationDate,
        equipmentData.lastMaintenanceDate,
        equipmentData.nextMaintenanceDate,
        equipmentData.maintenanceIntervalDays,
        equipmentData.criticality?.toLowerCase() || 'medium',
        JSON.stringify(equipmentData.specifications || {})
      ];

      if (existingEquipment) {
        // Update existing equipment
        await dbRun(
          `UPDATE equipment SET 
            name = ?, description = ?, manufacturer = ?, model = ?,
            serial_number = ?, location = ?, classification = ?,
            subsystem = ?, status = ?, installation_date = ?,
            last_maintenance_date = ?, next_maintenance_date = ?,
            maintenance_interval_days = ?, criticality = ?,
            notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [...equipmentValues, existingEquipment.id]
        );
      } else {
        // Insert new equipment
        await dbRun(
          `INSERT INTO equipment (
            vessel_id, qr_code, name, description, manufacturer, model,
            serial_number, location, classification, subsystem, status,
            installation_date, last_maintenance_date, next_maintenance_date,
            maintenance_interval_days, criticality, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [vessel.id, qrCode, ...equipmentValues]
        );
      }

      result.itemsSynced.equipment++;
      this.emit(SyncEvent.EQUIPMENT_SYNCED, { equipment: equipmentData });

      // Get the equipment ID for syncing maintenance tasks
      let equipmentId: number;
      if (existingEquipment) {
        equipmentId = existingEquipment.id;
      } else {
        const newEquipment = await dbGet(
          'SELECT id FROM equipment WHERE qr_code = ?',
          [qrCode]
        );
        equipmentId = newEquipment.id;
      }

      // Sync maintenance tasks if any
      if (equipmentData.maintenanceTasks && equipmentData.maintenanceTasks.length > 0) {
        await this.syncMaintenanceTasks(equipmentId, equipmentData.maintenanceTasks, result);
      }

      // Sync critical parts if any
      if (equipmentData.criticalParts && equipmentData.criticalParts.length > 0) {
        result.itemsSynced.parts += equipmentData.criticalParts.length;
      }

    } catch (error) {
      console.error(`Failed to sync equipment ${equipmentData.name}:`, error);
      throw error;
    }
  }

  // Sync maintenance tasks for a specific equipment
  private async syncMaintenanceTasks(equipmentId: number, tasks: any[], result: SyncResult) {
    try {
      for (const task of tasks) {
        // Check if task already exists
        const existingTask = await dbGet(
          'SELECT id FROM maintenance_tasks WHERE equipment_id = ? AND task_name = ?',
          [equipmentId, task.taskName]
        );

        const taskValues = [
          task.taskName,
          task.description,
          task.intervalValue,
          task.intervalUnit,
          task.priority || 'MEDIUM',
          task.estimatedHours,
          JSON.stringify(task.requiredParts || []),
          task.instructions,
          task.safetyNotes,
          JSON.stringify({}), // metadata
          task.id // sync_id from onboarding portal
        ];

        if (existingTask) {
          // Update existing task
          await dbRun(
            `UPDATE maintenance_tasks SET 
              description = ?, interval_value = ?, interval_unit = ?,
              priority = ?, estimated_hours = ?, required_parts = ?,
              instructions = ?, safety_notes = ?, metadata = ?,
              sync_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [...taskValues.slice(1), existingTask.id]
          );
        } else {
          // Insert new task
          await dbRun(
            `INSERT INTO maintenance_tasks (
              equipment_id, task_name, description, interval_value, interval_unit,
              priority, estimated_hours, required_parts, instructions, safety_notes,
              metadata, sync_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipmentId, ...taskValues, true]
          );
        }

        result.itemsSynced.maintenanceTasks++;
      }
    } catch (error) {
      console.error(`Failed to sync maintenance tasks for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  // Webhook handler for real-time sync
  async handleWebhook(eventType: string, data: any): Promise<void> {
    if (!this.config.enableRealTimeSync) {
      console.log('Real-time sync disabled, ignoring webhook');
      return;
    }

    console.log(`Handling webhook event: ${eventType}`);

    try {
      switch (eventType) {
        case 'vessel.approved':
          await this.syncSingleVessel(data.vessel);
          break;
        
        case 'equipment.created':
        case 'equipment.updated':
          await this.syncSingleEquipment(data.equipment, { itemsSynced: { equipment: 0, parts: 0, maintenanceTasks: 0 } } as SyncResult);
          break;
        
        case 'user.created':
        case 'user.updated':
          await this.syncSingleUser(data.user);
          break;
        
        default:
          console.warn(`Unknown webhook event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Failed to handle webhook event ${eventType}:`, error);
      throw error;
    }
  }

  // Get sync history
  async getSyncHistory(limit: number = 50): Promise<any[]> {
    return await dbAll(
      `SELECT * FROM sync_logs 
       ORDER BY started_at DESC 
       LIMIT ?`,
      [limit]
    );
  }

  // Get current sync status
  getCurrentSyncStatus(): { isSyncing: boolean; syncId: string | null } {
    return {
      isSyncing: this.isSyncing,
      syncId: this.currentSyncId
    };
  }

  // Helper methods
  private async makeApiRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.config.onboardingApiUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.onboardingApiKey}`,
      'Content-Type': 'application/json'
    };

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const response = await axios({
          method,
          url,
          headers,
          data,
          timeout: 30000
        });
        return response;
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          throw error;
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private generateQRCode(equipmentName: string): string {
    const prefix = 'SMS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private mapUserRole(onboardingRole: string): string {
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': 'admin',
      'ADMIN': 'admin',
      'MANAGER': 'manager',
      'TECHNICIAN': 'technician',
      'VIEWER': 'technician'
    };
    return roleMap[onboardingRole] || 'technician';
  }

  private mapEquipmentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'APPROVED': 'operational',
      'DOCUMENTED': 'operational',
      'REVIEWED': 'operational',
      'DRAFT': 'maintenance',
      'REJECTED': 'decommissioned'
    };
    return statusMap[status] || 'operational';
  }

  // Database helpers
  private async createSyncRecord(result: SyncResult) {
    await dbRun(
      `INSERT INTO sync_logs (
        id, type, direction, status, started_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.type,
        result.direction,
        result.status,
        result.startedAt.toISOString(),
        JSON.stringify(result.metadata || {})
      ]
    );
  }

  private async updateSyncRecord(result: SyncResult) {
    await dbRun(
      `UPDATE sync_logs SET 
        status = ?, completed_at = ?, 
        vessels_synced = ?, equipment_synced = ?, 
        users_synced = ?, parts_synced = ?, 
        documents_synced = ?, maintenance_tasks_synced = ?, errors = ?
      WHERE id = ?`,
      [
        result.status,
        result.completedAt?.toISOString() || null,
        result.itemsSynced.vessels,
        result.itemsSynced.equipment,
        result.itemsSynced.users,
        result.itemsSynced.parts,
        result.itemsSynced.documents,
        result.itemsSynced.maintenanceTasks,
        JSON.stringify(result.errors),
        result.id
      ]
    );
  }

  // Cleanup
  destroy() {
    if (this.scheduledJob) {
      this.scheduledJob.stop();
      this.scheduledJob = null;
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;