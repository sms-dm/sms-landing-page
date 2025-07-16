import { Router } from 'express';
import { 
  submitFeedback,
  getFeedback,
  updateFeedbackStatus
} from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Submit feedback (authenticated users)
router.post('/', authMiddleware, submitFeedback);

// Get all feedback (admin only)
router.get('/', authMiddleware, getFeedback);

// Update feedback status (admin only)
router.patch('/:id/status', authMiddleware, updateFeedbackStatus);

export default router;