import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as managerController from '../controllers/manager.controller';
import { UserRole } from '../../types/auth';

const router = Router();

// All routes require authentication and manager/admin role
router.use(authenticate);
router.use(authorize([UserRole.ADMIN, UserRole.MANAGER]));

// Vessel approval routes
router.get('/vessels/approval-ready', managerController.getVesselsForApproval);
router.get('/vessels/:vesselId/export-preview', managerController.getExportPreview);
router.get('/vessels/:vesselId/equipment', managerController.getEquipmentForReview);

// Equipment approval routes
router.post('/equipment/:equipmentId/approve', managerController.approveEquipment);
router.post('/equipment/:equipmentId/reject', managerController.rejectEquipment);

// Team management routes
router.get('/team-members', managerController.getTeamMembers);

export default router;