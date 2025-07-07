import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Set verification schedule for equipment (Manager/Admin only)
router.post('/schedule', verificationController.setVerificationSchedule);

// Get equipment due for verification
router.get('/due', verificationController.getEquipmentDueForVerification);

// Perform equipment verification
router.post('/perform', verificationController.performVerification);

// Get verification history
router.get('/history', verificationController.getVerificationHistory);

// Get verification notifications
router.get('/notifications', verificationController.getVerificationNotifications);

// Acknowledge notification
router.post('/notifications/acknowledge', verificationController.acknowledgeNotification);

// Get verification dashboard statistics
router.get('/dashboard', verificationController.getVerificationDashboard);

export default router;