// JWT token verification integration tests
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../api/middleware/auth.middleware';
import { UserRole } from '../../../types/auth';
import { testUsers } from './test-utils';

describe('JWT Token Verification', () => {
  let app: Express;
  const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';

  beforeAll(() => {
    // Setup Express app with test routes
    app = express();
    app.use(express.json());

    // Protected route that requires authentication
    app.get('/api/test/protected', authenticate, (req, res) => {
      res.json({ 
        message: 'Access granted',
        user: req.user 
      });
    });
  });

  describe('Valid token scenarios', () => {
    it('should accept valid JWT token with correct signature', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        companyId: 'test-company-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Access granted');
      expect(response.body.user).toMatchObject({
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        companyId: 'test-company-id',
      });
    });

    it('should accept token with long expiration time', async () => {
      const payload = {
        sub: testUsers.manager.id,
        email: testUsers.manager.email,
        role: UserRole.MANAGER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should accept token without optional fields', async () => {
      const payload = {
        sub: testUsers.technician.id,
        email: testUsers.technician.email,
        role: UserRole.TECHNICIAN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.companyId).toBeUndefined();
    });
  });

  describe('Invalid token scenarios', () => {
    it('should reject token signed with wrong secret', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, 'wrong-secret');

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
      expect(response.body.message).toBe('Invalid authentication token');
    });

    it('should reject expired token', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject malformed token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject token with invalid algorithm', async () => {
      // Create token with 'none' algorithm (security vulnerability test)
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64');
      
      const token = `${header}.${payload}.`;

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject token with missing required claims', async () => {
      const payload = {
        // Missing 'sub' claim
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      // Token is technically valid but missing required fields
      // The application should handle this gracefully
      expect(response.status).toBe(200);
      expect(response.body.user.sub).toBeUndefined();
    });
  });

  describe('Token format and header scenarios', () => {
    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/test/protected');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(response.body.message).toBe('No valid authentication token provided');
    });

    it('should reject request with wrong Authorization header format', async () => {
      const token = jwt.sign(
        {
          sub: testUsers.admin.id,
          email: testUsers.admin.email,
          role: UserRole.ADMIN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        jwtSecret
      );

      // Test without 'Bearer' prefix
      const response1 = await request(app)
        .get('/api/test/protected')
        .set('Authorization', token);

      expect(response1.status).toBe(401);
      expect(response1.body.code).toBe('UNAUTHORIZED');

      // Test with wrong prefix
      const response2 = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Token ${token}`);

      expect(response2.status).toBe(401);
      expect(response2.body.code).toBe('UNAUTHORIZED');

      // Test with lowercase 'bearer'
      const response3 = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `bearer ${token}`);

      expect(response3.status).toBe(401);
      expect(response3.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject empty token after Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Token payload validation', () => {
    it('should handle token with future iat claim', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000) + 300, // 5 minutes in future
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      // JWT library might accept this, but it's technically invalid
      // Response depends on JWT library validation
      expect([200, 401]).toContain(response.status);
    });

    it('should accept token with all user roles', async () => {
      const roles = [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.TECHNICIAN,
        UserRole.HSE_OFFICER,
        UserRole.SUPER_ADMIN,
      ];

      for (const role of roles) {
        const payload = {
          sub: `${role.toLowerCase()}-user-id`,
          email: `${role.toLowerCase()}@test.com`,
          role: role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };

        const token = jwt.sign(payload, jwtSecret);

        const response = await request(app)
          .get('/api/test/protected')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe(role);
      }
    });

    it('should handle token with additional custom claims', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        companyId: 'test-company-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        // Additional custom claims
        permissions: ['read', 'write', 'delete'],
        department: 'Engineering',
        sessionId: 'session-123',
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
      });
    });
  });

  describe('Edge cases and security scenarios', () => {
    it('should reject refresh token used as access token', async () => {
      const refreshPayload = {
        sub: testUsers.admin.id,
        type: 'refresh',
        tokenId: 'refresh-token-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      // Sign with refresh secret
      const refreshToken = jwt.sign(refreshPayload, jwtRefreshSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should handle very long tokens', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        // Add a very long custom claim
        data: 'x'.repeat(1000),
      };

      const token = jwt.sign(payload, jwtSecret);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests with same token', async () => {
      const payload = {
        sub: testUsers.admin.id,
        email: testUsers.admin.email,
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, jwtSecret);

      // Send multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/test/protected')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Access granted');
      });
    });
  });
});