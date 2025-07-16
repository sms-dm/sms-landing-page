// Role-based access control integration tests
import request from 'supertest';
import express, { Express } from 'express';
import { UserRole } from '../../../types/auth';
import { authenticate, authorize } from '../../../api/middleware/auth.middleware';
import { testUsers, generateExpiredToken } from './test-utils';
import jwt from 'jsonwebtoken';

describe('Role-Based Access Control', () => {
  let app: Express;
  
  beforeAll(() => {
    // Setup Express app with test routes
    app = express();
    app.use(express.json());

    // Test routes for different role requirements
    app.get('/api/test/public', (req, res) => {
      res.json({ message: 'Public access' });
    });

    app.get('/api/test/authenticated', authenticate, (req, res) => {
      res.json({ message: 'Authenticated access', user: req.user });
    });

    app.get('/api/test/admin-only', authenticate, authorize([UserRole.ADMIN]), (req, res) => {
      res.json({ message: 'Admin only access' });
    });

    app.get('/api/test/manager-only', authenticate, authorize([UserRole.MANAGER]), (req, res) => {
      res.json({ message: 'Manager only access' });
    });

    app.get('/api/test/tech-only', authenticate, authorize([UserRole.TECHNICIAN]), (req, res) => {
      res.json({ message: 'Technician only access' });
    });

    app.get('/api/test/hse-only', authenticate, authorize([UserRole.HSE_OFFICER]), (req, res) => {
      res.json({ message: 'HSE Officer only access' });
    });

    app.get('/api/test/multi-role', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), (req, res) => {
      res.json({ message: 'Admin or Manager access' });
    });

    app.get('/api/test/management', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]), (req, res) => {
      res.json({ message: 'Management access' });
    });
  });

  describe('Authentication middleware', () => {
    it('should allow access to public routes without token', async () => {
      const response = await request(app)
        .get('/api/test/public');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Public access');
    });

    it('should deny access to authenticated routes without token', async () => {
      const response = await request(app)
        .get('/api/test/authenticated');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(response.body.message).toBe('No valid authentication token provided');
    });

    it('should allow access to authenticated routes with valid token', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.admin.id,
          email: testUsers.admin.email,
          role: testUsers.admin.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authenticated access');
      expect(response.body.user).toHaveProperty('sub', testUsers.admin.id);
    });

    it('should deny access with expired token', async () => {
      const expiredToken = generateExpiredToken(testUsers.admin.id, testUsers.admin.role);

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should deny access with malformed token', async () => {
      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Authorization middleware - Single role access', () => {
    it('should allow ADMIN access to admin-only routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.admin.id,
          email: testUsers.admin.email,
          role: UserRole.ADMIN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin only access');
    });

    it('should deny non-ADMIN access to admin-only routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.manager.id,
          email: testUsers.manager.email,
          role: UserRole.MANAGER,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(response.body.message).toBe('Insufficient permissions for this operation');
      expect(response.body.details.requiredRoles).toContain(UserRole.ADMIN);
      expect(response.body.details.userRole).toBe(UserRole.MANAGER);
    });

    it('should allow MANAGER access to manager-only routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.manager.id,
          email: testUsers.manager.email,
          role: UserRole.MANAGER,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/manager-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Manager only access');
    });

    it('should allow TECHNICIAN access to tech-only routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.technician.id,
          email: testUsers.technician.email,
          role: UserRole.TECHNICIAN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/tech-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Technician only access');
    });

    it('should allow HSE_OFFICER access to hse-only routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.hseOfficer.id,
          email: testUsers.hseOfficer.email,
          role: UserRole.HSE_OFFICER,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/hse-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('HSE Officer only access');
    });
  });

  describe('Authorization middleware - Multi-role access', () => {
    it('should allow ADMIN access to multi-role routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.admin.id,
          email: testUsers.admin.email,
          role: UserRole.ADMIN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/multi-role')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin or Manager access');
    });

    it('should allow MANAGER access to multi-role routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.manager.id,
          email: testUsers.manager.email,
          role: UserRole.MANAGER,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/multi-role')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin or Manager access');
    });

    it('should deny TECHNICIAN access to admin/manager routes', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.technician.id,
          email: testUsers.technician.email,
          role: UserRole.TECHNICIAN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/multi-role')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(response.body.details.requiredRoles).toContain(UserRole.ADMIN);
      expect(response.body.details.requiredRoles).toContain(UserRole.MANAGER);
    });
  });

  describe('Role hierarchy and special cases', () => {
    it('should handle SUPER_ADMIN role for management routes', async () => {
      const token = jwt.sign(
        {
          sub: 'super-admin-id',
          email: 'superadmin@example.com',
          role: UserRole.SUPER_ADMIN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get('/api/test/management')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Management access');
    });

    it('should handle missing user object in request', async () => {
      // Create a route that calls authorize without authenticate
      app.get('/api/test/bad-setup', authorize([UserRole.ADMIN]), (req, res) => {
        res.json({ message: 'Should not reach here' });
      });

      const response = await request(app)
        .get('/api/test/bad-setup');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('Cross-role access patterns', () => {
    const createTokenForRole = (role: UserRole) => {
      return jwt.sign(
        {
          sub: `${role.toLowerCase()}-id`,
          email: `${role.toLowerCase()}@test.com`,
          role: role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );
    };

    const testCases = [
      { role: UserRole.ADMIN, allowedRoutes: ['/api/test/admin-only', '/api/test/multi-role', '/api/test/management'] },
      { role: UserRole.MANAGER, allowedRoutes: ['/api/test/manager-only', '/api/test/multi-role', '/api/test/management'] },
      { role: UserRole.TECHNICIAN, allowedRoutes: ['/api/test/tech-only'] },
      { role: UserRole.HSE_OFFICER, allowedRoutes: ['/api/test/hse-only'] },
    ];

    testCases.forEach(({ role, allowedRoutes }) => {
      it(`should enforce correct access for ${role} role`, async () => {
        const token = createTokenForRole(role);
        const allRoutes = [
          '/api/test/admin-only',
          '/api/test/manager-only',
          '/api/test/tech-only',
          '/api/test/hse-only',
          '/api/test/multi-role',
          '/api/test/management',
        ];

        for (const route of allRoutes) {
          const response = await request(app)
            .get(route)
            .set('Authorization', `Bearer ${token}`);

          if (allowedRoutes.includes(route)) {
            expect(response.status).toBe(200);
          } else {
            expect(response.status).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
          }
        }
      });
    });
  });
});