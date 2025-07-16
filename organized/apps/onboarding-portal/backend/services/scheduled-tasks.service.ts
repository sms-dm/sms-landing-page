import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

export class ScheduledTasksService {
  private tasks: cron.ScheduledTask[] = [];

  start() {
    console.log('Starting scheduled tasks...');

    // Run verification notifications daily at 8 AM
    const notificationTask = cron.schedule('0 8 * * *', async () => {
      console.log('Running verification notification task...');
      await this.createVerificationNotifications();
    });

    // Run quality score degradation daily at 2 AM
    const degradationTask = cron.schedule('0 2 * * *', async () => {
      console.log('Running quality score degradation task...');
      await this.degradeQualityScores();
    });

    this.tasks.push(notificationTask, degradationTask);
    
    // Start all tasks
    this.tasks.forEach(task => task.start());
    
    console.log('Scheduled tasks started successfully');
  }

  stop() {
    console.log('Stopping scheduled tasks...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
  }

  // Create verification notifications for equipment due soon or overdue
  private async createVerificationNotifications() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Find equipment due for verification
      const equipmentDue = await prisma.equipment.findMany({
        where: {
          nextVerificationDate: {
            not: null,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          vessel: {
            select: {
              companyId: true,
            },
          },
        },
      });

      for (const equipment of equipmentDue) {
        const daysUntilDue = Math.floor(
          (equipment.nextVerificationDate!.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        );

        let notificationType: string;
        if (daysUntilDue < -30) {
          notificationType = 'CRITICAL_OVERDUE';
        } else if (daysUntilDue < 0) {
          notificationType = 'OVERDUE';
        } else {
          notificationType = 'DUE_SOON';
        }

        // Get managers and admins from the company
        const recipients = await prisma.user.findMany({
          where: {
            companyId: equipment.vessel.companyId,
            role: {
              in: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
            },
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        // Create notifications for each recipient
        for (const recipient of recipients) {
          // Check if notification already exists for today
          const existingNotification = await prisma.verificationNotification.findFirst({
            where: {
              equipmentId: equipment.id,
              sentTo: recipient.id,
              createdAt: {
                gte: new Date(today.setHours(0, 0, 0, 0)),
                lt: new Date(today.setHours(23, 59, 59, 999)),
              },
            },
          });

          if (!existingNotification) {
            await prisma.verificationNotification.create({
              data: {
                equipmentId: equipment.id,
                notificationType,
                daysUntilDue,
                sentTo: recipient.id,
              },
            });

            // Also create a general notification
            await prisma.notification.create({
              data: {
                userId: recipient.id,
                type: 'VERIFICATION_DUE',
                title: `Equipment Verification ${notificationType === 'DUE_SOON' ? 'Due Soon' : 'Overdue'}`,
                message: `Equipment "${equipment.name}" ${
                  daysUntilDue < 0
                    ? `is ${Math.abs(daysUntilDue)} days overdue for verification`
                    : `is due for verification in ${daysUntilDue} days`
                }`,
                data: {
                  equipmentId: equipment.id,
                  notificationType,
                  daysUntilDue,
                },
              },
            });
          }
        }
      }

      console.log(`Created verification notifications for ${equipmentDue.length} equipment`);
    } catch (error) {
      console.error('Error creating verification notifications:', error);
    }
  }

  // Degrade quality scores for overdue equipment
  private async degradeQualityScores() {
    try {
      const today = new Date();

      // Find overdue equipment
      const overdueEquipment = await prisma.equipment.findMany({
        where: {
          nextVerificationDate: {
            not: null,
            lt: today,
          },
          qualityScore: {
            gt: 0,
          },
        },
      });

      for (const equipment of overdueEquipment) {
        const daysOverdue = Math.floor(
          (today.getTime() - equipment.nextVerificationDate!.getTime()) / (24 * 60 * 60 * 1000)
        );

        const degradationRate = equipment.dataQualityDegradationRate || 5;
        const degradation = Math.floor(
          (equipment.qualityScore * degradationRate * daysOverdue) / 30 / 100
        );

        const newQualityScore = Math.max(0, equipment.qualityScore - degradation);

        if (newQualityScore !== equipment.qualityScore) {
          await prisma.equipment.update({
            where: { id: equipment.id },
            data: {
              qualityScore: newQualityScore,
            },
          });

          // Create a quality score record
          await prisma.qualityScore.create({
            data: {
              equipmentId: equipment.id,
              metric: 'ACCURACY',
              score: newQualityScore,
              details: {
                reason: 'Automatic degradation due to overdue verification',
                daysOverdue,
                degradationRate,
                previousScore: equipment.qualityScore,
              },
            },
          });
        }
      }

      console.log(`Degraded quality scores for ${overdueEquipment.length} equipment`);
    } catch (error) {
      console.error('Error degrading quality scores:', error);
    }
  }

  // Run a specific task immediately (for testing)
  async runTask(taskName: 'notifications' | 'degradation') {
    switch (taskName) {
      case 'notifications':
        await this.createVerificationNotifications();
        break;
      case 'degradation':
        await this.degradeQualityScores();
        break;
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }
}

// Export singleton instance
export const scheduledTasksService = new ScheduledTasksService();