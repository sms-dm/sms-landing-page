// Authentication routes
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { 
  loginRateLimiter, 
  registrationRateLimiter, 
  passwordResetRateLimiter 
} from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// POST /auth/register
router.post(
  '/register',
  registrationRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('fullName').notEmpty().trim(),
    body('role').isIn(['ADMIN', 'TECHNICIAN', 'MANAGER', 'HSE_OFFICER']),
    body('companyName').optional().trim(),
    body('inviteToken').optional().trim(),
  ],
  validateRequest,
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('rememberMe').optional().isBoolean(),
  ],
  validateRequest,
  authController.login
);

// POST /auth/refresh
router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validateRequest,
  authController.refreshToken
);

// POST /auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  authController.forgotPassword
);

// POST /auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  ],
  validateRequest,
  authController.resetPassword
);

// GET /auth/me
router.get('/me', authenticate, authController.getCurrentUser);

// PATCH /auth/me
router.patch(
  '/me',
  authenticate,
  [
    body('fullName').optional().trim(),
    body('phoneNumber').optional().isMobilePhone(),
    body('avatarUrl').optional().isURL(),
    body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
    body('preferences.language').optional().isString(),
    body('preferences.notifications.email').optional().isBoolean(),
    body('preferences.notifications.push').optional().isBoolean(),
    body('preferences.notifications.inApp').optional().isBoolean(),
  ],
  validateRequest,
  authController.updateCurrentUser
);

// POST /auth/change-password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  ],
  validateRequest,
  authController.changePassword
);

export default router;