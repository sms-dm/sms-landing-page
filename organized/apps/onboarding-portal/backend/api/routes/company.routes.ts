// Company management routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as companyController from '../controllers/company.controller';
import { UserRole } from '../../types/auth';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /companies
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('sort').optional().matches(/^[a-zA-Z_]+:(asc|desc)$/),
  ],
  validateRequest,
  companyController.listCompanies
);

// POST /companies
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  [
    body('name').notEmpty().trim(),
    body('registrationNumber').optional().trim(),
    body('address.street').notEmpty().trim(),
    body('address.city').notEmpty().trim(),
    body('address.state').optional().trim(),
    body('address.postalCode').notEmpty().trim(),
    body('address.country').notEmpty().trim(),
    body('contact.email').isEmail().normalizeEmail(),
    body('contact.phone').notEmpty().trim(),
    body('contact.website').optional().isURL(),
    body('logoUrl').optional().isURL(),
  ],
  validateRequest,
  companyController.createCompany
);

// GET /companies/:companyId
router.get(
  '/:companyId',
  authenticate,
  [param('companyId').isUUID()],
  validateRequest,
  companyController.getCompany
);

// PATCH /companies/:companyId
router.patch(
  '/:companyId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [
    param('companyId').isUUID(),
    body('name').optional().trim(),
    body('registrationNumber').optional().trim(),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.postalCode').optional().trim(),
    body('address.country').optional().trim(),
    body('contact.email').optional().isEmail().normalizeEmail(),
    body('contact.phone').optional().trim(),
    body('contact.website').optional().isURL(),
    body('logoUrl').optional().isURL(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  companyController.updateCompany
);

// DELETE /companies/:companyId
router.delete(
  '/:companyId',
  authenticate,
  authorize([UserRole.ADMIN]),
  [param('companyId').isUUID()],
  validateRequest,
  companyController.deleteCompany
);

export default router;