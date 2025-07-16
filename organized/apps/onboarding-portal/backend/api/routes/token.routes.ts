// Token management routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as tokenController from '../controllers/token.controller';
import { UserRole } from '../../types/auth';
import { TokenStatus, TokenPermission } from '../../types/entities';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /tokens
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('vesselId').optional().isUUID(),
    query('status').optional().isIn(Object.values(TokenStatus)),
  ],
  validateRequest,
  tokenController.listTokens
);

// POST /tokens
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  [
    body('vesselId').isUUID(),
    body('validUntil').isISO8601(),
    body('maxUses').optional().isInt({ min: 1 }),
    body('permissions').isArray().notEmpty(),
    body('permissions.*').isIn(Object.values(TokenPermission)),
    body('metadata.ipRestrictions').optional().isArray(),
    body('metadata.ipRestrictions.*').optional().isIP(),
    body('metadata.allowedUsers').optional().isArray(),
    body('metadata.allowedUsers.*').optional().isEmail(),
    body('metadata.notes').optional().trim(),
  ],
  validateRequest,
  tokenController.generateToken
);

// GET /tokens/:tokenId
router.get(
  '/:tokenId',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  [param('tokenId').isUUID()],
  validateRequest,
  tokenController.getToken
);

// DELETE /tokens/:tokenId
router.delete(
  '/:tokenId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [param('tokenId').isUUID()],
  validateRequest,
  tokenController.revokeToken
);

// POST /tokens/validate
router.post(
  '/validate',
  // No authentication required for token validation
  [body('token').notEmpty().trim()],
  validateRequest,
  tokenController.validateToken
);

export default router;