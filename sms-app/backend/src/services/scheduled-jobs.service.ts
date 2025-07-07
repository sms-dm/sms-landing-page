import { emailQueueService } from './email-queue.service';
import { activationCodeService } from './activation-code.service';
import { CertificateService } from './certificate.service';
import { MaintenanceReminderService } from './maintenance-reminder.service';

interface ScheduledJob {
  name: string;
  interval: number;
  task: () => Promise<void>;
  timer?: NodeJS.Timeout;
}

class ScheduledJobsService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private isRunning = false;

  constructor() {
    // Define scheduled jobs
    this.registerJob({
      name: 'process-email-queue',
      interval: 60000, // Every minute
      task: async () => {
        await emailQueueService.processQueue();
      }
    });

    this.registerJob({
      name: 'send-activation-reminders',
      interval: 3600000, // Every hour
      task: async () => {
        const count = await activationCodeService.sendActivationReminders();
        if (count > 0) {
          console.log(`📧 Sent ${count} activation reminder emails`);
        }
      }
    });

    this.registerJob({
      name: 'send-expiry-notifications',
      interval: 3600000, // Every hour
      task: async () => {
        const count = await activationCodeService.sendExpiryNotifications();
        if (count > 0) {
          console.log(`📧 Sent ${count} activation expiry notifications`);
        }
      }
    });

    this.registerJob({
      name: 'retry-failed-emails',
      interval: 3600000, // Every hour
      task: async () => {
        const count = await emailQueueService.retryFailed(60); // Retry emails failed more than 60 minutes ago
        if (count > 0) {
          console.log(`🔄 Retrying ${count} failed emails`);
        }
      }
    });

    this.registerJob({
      name: 'clean-old-emails',
      interval: 86400000, // Daily
      task: async () => {
        const count = await emailQueueService.cleanOldEmails(30); // Clean emails older than 30 days
        if (count > 0) {
          console.log(`🧹 Cleaned ${count} old emails from queue`);
        }
      }
    });

    this.registerJob({
      name: 'check-certificate-warnings',
      interval: 86400000, // Daily
      task: async () => {
        console.log('🏗️ Checking HSE certificate expiry warnings...');
        await CertificateService.updateAllCertificateWarnings();
        console.log('✅ Certificate warnings check completed');
      }
    });

    this.registerJob({
      name: 'send-maintenance-reminders',
      interval: 86400000, // Daily
      task: async () => {
        console.log('🔧 Checking maintenance due dates...');
        await MaintenanceReminderService.checkAndSendMaintenanceReminders();
        console.log('✅ Maintenance reminders check completed');
      }
    });
  }

  private registerJob(job: ScheduledJob): void {
    this.jobs.set(job.name, job);
  }

  // Start all scheduled jobs
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Scheduled jobs already running');
      return;
    }

    console.log('🚀 Starting scheduled jobs...');
    
    for (const [name, job] of this.jobs) {
      // Run immediately
      job.task().catch(error => {
        console.error(`❌ Error in scheduled job ${name}:`, error);
      });

      // Set up interval
      job.timer = setInterval(() => {
        job.task().catch(error => {
          console.error(`❌ Error in scheduled job ${name}:`, error);
        });
      }, job.interval);

      console.log(`✅ Started job: ${name} (every ${job.interval / 1000}s)`);
    }

    this.isRunning = true;
  }

  // Stop all scheduled jobs
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping scheduled jobs...');

    for (const [name, job] of this.jobs) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = undefined;
        console.log(`✅ Stopped job: ${name}`);
      }
    }

    this.isRunning = false;
  }

  // Run a specific job manually
  async runJob(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    console.log(`🏃 Running job manually: ${jobName}`);
    await job.task();
  }

  // Get job status
  getStatus(): Array<{
    name: string;
    interval: number;
    running: boolean;
  }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      interval: job.interval,
      running: !!job.timer
    }));
  }
}

// Export singleton instance
export const scheduledJobsService = new ScheduledJobsService();