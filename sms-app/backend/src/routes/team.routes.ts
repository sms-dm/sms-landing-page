import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { TeamController } from '../controllers/team.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get team structure
router.get('/structure', TeamController.getTeamStructure);

// Get user profile
router.get('/users/:userId', TeamController.getUserProfile);

// Update user status
router.put('/status', TeamController.updateUserStatus);

// Search team members
router.get('/search', TeamController.searchTeamMembers);

// Get departments
router.get('/departments', TeamController.getDepartments);

// Get team statistics (managers only)
router.get('/statistics', 
  roleMiddleware(['admin', 'manager', 'hse_manager']),
  TeamController.getTeamStatistics
);

// Create team announcement (managers only)
router.post('/announcements', 
  roleMiddleware(['admin', 'manager', 'hse_manager']),
  TeamController.createTeamAnnouncement
);

// Get online team members
router.get('/online', TeamController.getOnlineMembers);

export default router;