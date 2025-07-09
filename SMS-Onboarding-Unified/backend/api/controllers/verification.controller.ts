import { Request, Response } from 'express';
// PrismaClient import removed
import { z } from 'zod';

import { prisma } from '../../services/prisma';

// Validation schemas
const setVerificationScheduleSchema = z.object({
  equipmentId: z.string().uuid(),
  verificationIntervalDays: z.number().int().positive(),
  dataQualityDegradationRate: z.number().int().min(0).max(100).optional(),
});

const performVerificationSchema = z.object({
  equipmentId: z.string().uuid(),
  verificationType: z.enum(['SCHEDULED', 'MANUAL', 'CORRECTIVE']),
  findings: z.string().optional(),
  correctiveActions: z.string().optional(),
  newQualityScore: z.number().int().min(0).max(100),
});

const acknowledgeNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export const verificationController = {
  // Set verification schedule for equipment
  async setVerificationSchedule(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const data = setVerificationScheduleSchema.parse(req.body);

      // Check if user has permission (Manager or Admin)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, companyId: true },
      });

      if (!user || !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Verify equipment belongs to user's company
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: data.equipmentId,
          vessel: {
            companyId: user.companyId,
          },
        },
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      // Update equipment with verification schedule
      const updatedEquipment = await prisma.equipment.update({
        where: { id: data.equipmentId },
        data: {
          verificationIntervalDays: data.verificationIntervalDays,
          dataQualityDegradationRate: data.dataQualityDegradationRate,
          // If setting schedule for first time, set next verification date
          nextVerificationDate: equipment.lastVerifiedAt
            ? new Date(
                equipment.lastVerifiedAt.getTime() +
                  data.verificationIntervalDays * 24 * 60 * 60 * 1000
              )
            : new Date(
                Date.now() + data.verificationIntervalDays * 24 * 60 * 60 * 1000
              ),
        },
      });

      res.json({
        message: 'Verification schedule updated successfully',
        equipment: updatedEquipment,
      });
    } catch (error) {
      console.error('Error setting verification schedule:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to set verification schedule' });
    }
  },

  // Get equipment due for verification
  async getEquipmentDueForVerification(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { vesselId, daysAhead = 30, overdue = false } = req.query;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      const today = new Date();
      const futureDate = new Date(today.getTime() + Number(daysAhead) * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        vessel: {
          companyId: user.companyId,
        },
        nextVerificationDate: {
          not: null,
        },
      };

      if (vesselId) {
        whereClause.vesselId = vesselId;
      }

      if (overdue === 'true') {
        whereClause.nextVerificationDate.lt = today;
      } else {
        whereClause.nextVerificationDate.lte = futureDate;
      }

      const equipment = await prisma.equipment.findMany({
        where: whereClause,
        include: {
          vessel: {
            select: {
              name: true,
            },
          },
          location: {
            select: {
              name: true,
              path: true,
            },
          },
          verifiedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          nextVerificationDate: 'asc',
        },
      });

      // Calculate degraded quality scores
      const equipmentWithDegradedScores = equipment.map((eq) => {
        let degradedQualityScore = eq.qualityScore;
        
        if (eq.nextVerificationDate && eq.nextVerificationDate < today) {
          const daysOverdue = Math.floor(
            (today.getTime() - eq.nextVerificationDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          const degradationRate = eq.dataQualityDegradationRate || 5;
          const degradation = Math.floor(
            (eq.qualityScore * degradationRate * daysOverdue) / 30 / 100
          );
          degradedQualityScore = Math.max(0, eq.qualityScore - degradation);
        }

        return {
          ...eq,
          degradedQualityScore,
          daysUntilDue: eq.nextVerificationDate
            ? Math.floor(
                (eq.nextVerificationDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
              )
            : null,
        };
      });

      res.json({
        equipment: equipmentWithDegradedScores,
        total: equipmentWithDegradedScores.length,
      });
    } catch (error) {
      console.error('Error getting equipment due for verification:', error);
      res.status(500).json({ error: 'Failed to get equipment due for verification' });
    }
  },

  // Perform equipment verification
  async performVerification(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const data = performVerificationSchema.parse(req.body);

      // Get equipment with current quality score
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: data.equipmentId,
          vessel: {
            company: {
              users: {
                some: { id: userId },
              },
            },
          },
        },
        include: {
          qualityScores: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      const qualityScoreBefore = equipment.qualityScore;

      // Create verification record
      const verification = await prisma.equipmentVerification.create({
        data: {
          equipmentId: data.equipmentId,
          verifiedBy: userId,
          verificationType: data.verificationType,
          qualityScoreBefore,
          qualityScoreAfter: data.newQualityScore,
          findings: data.findings,
          correctiveActions: data.correctiveActions,
          nextVerificationDate: equipment.verificationIntervalDays
            ? new Date(
                Date.now() + equipment.verificationIntervalDays * 24 * 60 * 60 * 1000
              )
            : undefined,
        },
      });

      // Update equipment
      await prisma.equipment.update({
        where: { id: data.equipmentId },
        data: {
          lastVerifiedAt: new Date(),
          verifiedBy: userId,
          qualityScore: data.newQualityScore,
          nextVerificationDate: verification.nextVerificationDate,
          verificationNotes: data.findings,
        },
      });

      // Create quality score record
      await prisma.qualityScore.create({
        data: {
          equipmentId: data.equipmentId,
          metric: 'ACCURACY',
          score: data.newQualityScore,
          evaluatedBy: userId,
          details: {
            verificationType: data.verificationType,
            verificationId: verification.id,
          },
        },
      });

      res.json({
        message: 'Verification completed successfully',
        verification,
      });
    } catch (error) {
      console.error('Error performing verification:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to perform verification' });
    }
  },

  // Get verification history
  async getVerificationHistory(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { equipmentId, vesselId, limit = 50, offset = 0 } = req.query;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      const whereClause: any = {
        equipment: {
          vessel: {
            companyId: user.companyId,
          },
        },
      };

      if (equipmentId) {
        whereClause.equipmentId = equipmentId;
      }

      if (vesselId) {
        whereClause.equipment.vesselId = vesselId;
      }

      const [verifications, total] = await Promise.all([
        prisma.equipmentVerification.findMany({
          where: whereClause,
          include: {
            equipment: {
              select: {
                name: true,
                code: true,
                vessel: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            verifiedByUser: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            verificationDate: 'desc',
          },
          take: Number(limit),
          skip: Number(offset),
        }),
        prisma.equipmentVerification.count({ where: whereClause }),
      ]);

      res.json({
        verifications,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('Error getting verification history:', error);
      res.status(500).json({ error: 'Failed to get verification history' });
    }
  },

  // Get verification notifications
  async getVerificationNotifications(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { unacknowledged = 'true' } = req.query;

      const whereClause: any = {
        sentTo: userId,
      };

      if (unacknowledged === 'true') {
        whereClause.acknowledgedAt = null;
      }

      const notifications = await prisma.verificationNotification.findMany({
        where: whereClause,
        include: {
          equipment: {
            select: {
              name: true,
              code: true,
              nextVerificationDate: true,
              vessel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({ notifications });
    } catch (error) {
      console.error('Error getting verification notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  // Acknowledge notification
  async acknowledgeNotification(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const data = acknowledgeNotificationSchema.parse(req.body);

      const notification = await prisma.verificationNotification.findFirst({
        where: {
          id: data.notificationId,
          sentTo: userId,
          acknowledgedAt: null,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.verificationNotification.update({
        where: { id: data.notificationId },
        data: {
          acknowledgedAt: new Date(),
        },
      });

      res.json({ message: 'Notification acknowledged' });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to acknowledge notification' });
    }
  },

  // Dashboard statistics for verification
  async getVerificationDashboard(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { vesselId } = req.query;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        vessel: {
          companyId: user.companyId,
        },
      };

      if (vesselId) {
        whereClause.vesselId = vesselId;
      }

      // Get statistics
      const [
        totalEquipment,
        overdueCount,
        dueSoonCount,
        recentVerifications,
        averageQualityScore,
      ] = await Promise.all([
        // Total equipment with verification schedules
        prisma.equipment.count({
          where: {
            ...whereClause,
            verificationIntervalDays: { not: null },
          },
        }),
        // Overdue verifications
        prisma.equipment.count({
          where: {
            ...whereClause,
            nextVerificationDate: {
              lt: today,
            },
          },
        }),
        // Due soon (next 30 days)
        prisma.equipment.count({
          where: {
            ...whereClause,
            nextVerificationDate: {
              gte: today,
              lte: thirtyDaysFromNow,
            },
          },
        }),
        // Recent verifications (last 30 days)
        prisma.equipmentVerification.count({
          where: {
            equipment: whereClause,
            verificationDate: {
              gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Average quality score
        prisma.equipment.aggregate({
          where: whereClause,
          _avg: {
            qualityScore: true,
          },
        }),
      ]);

      res.json({
        statistics: {
          totalEquipment,
          overdueCount,
          dueSoonCount,
          recentVerifications,
          averageQualityScore: Math.round(averageQualityScore._avg.qualityScore || 0),
        },
      });
    } catch (error) {
      console.error('Error getting verification dashboard:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  },
};