// Refresh token flow integration tests
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from '../../../api/routes/auth.routes';
import { userService } from '../../../services/user.service';
import { UserRole } from '../../../types/auth';
import { testUsers } from './test-utils';

// Mock the services
jest.mock('../../../services/user.service');
jest.mock('../../../services/email.service');

describe('Refresh Token Flow', () => {
  let app: Express;
  const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const userId = testUsers.admin.id;
      const refreshTokenId = 'refresh-token-123';
      
      // Create a valid refresh token
      const refreshToken = jwt.sign(
        {
          sub: userId,
          type: 'refresh',
          tokenId: refreshTokenId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        },
        jwtRefreshSecret
      );

      const mockUser = {
        id: userId,
        email: testUsers.admin.email,
        fullName: testUsers.admin.fullName,
        role: UserRole.ADMIN,
        companyId: 'test-company-id',
        isActive: true,
        avatarUrl: null,
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true,
          },
        },
      };

      const mockStoredToken = {
        id: refreshTokenId,
        userId: userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Mock service methods
      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (userService.updateRefreshTokenLastUsed as jest.Mock).mockResolvedValue(undefined);
      (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.admin.email);
      
      // Verify old token was deleted
      expect(userService.deleteRefreshToken).toHaveBeenCalledWith(refreshTokenId);
      
      // Verify new token was created
      expect(userService.createRefreshToken).toHaveBeenCalled();
      
      // Verify new tokens are different from old ones
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid refresh token format', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.format' });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('should fail with expired refresh token', async () => {
      const expiredRefreshToken = jwt.sign(
        {
          sub: testUsers.admin.id,
          type: 'refresh',
          tokenId: 'expired-token-123',
          iat: Math.floor(Date.now() / 1000) - (40 * 24 * 60 * 60), // 40 days ago
          exp: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60), // 10 days ago
        },
        jwtRefreshSecret
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should fail if refresh token not found in database', async () => {
      const refreshToken = jwt.sign(
        {
          sub: testUsers.admin.id,
          type: 'refresh',
          tokenId: 'non-existent-token',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should fail if user not found', async () => {
      const refreshToken = jwt.sign(
        {
          sub: 'non-existent-user',
          type: 'refresh',
          tokenId: 'token-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      const mockStoredToken = {
        id: 'token-123',
        userId: 'non-existent-user',
        token: refreshToken,
      };

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('USER_NOT_FOUND');
      expect(response.body.message).toBe('User not found or inactive');
    });

    it('should fail if user is inactive', async () => {
      const refreshToken = jwt.sign(
        {
          sub: testUsers.admin.id,
          type: 'refresh',
          tokenId: 'token-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      const mockStoredToken = {
        id: 'token-123',
        userId: testUsers.admin.id,
        token: refreshToken,
      };

      const mockInactiveUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        isActive: false,
      };

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(mockInactiveUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('USER_NOT_FOUND');
      expect(response.body.message).toBe('User not found or inactive');
    });

    it('should fail with access token instead of refresh token', async () => {
      // Create an access token (without type: 'refresh')
      const accessToken = jwt.sign(
        {
          sub: testUsers.admin.id,
          email: testUsers.admin.email,
          role: UserRole.ADMIN,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        jwtSecret // Note: using access token secret
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: accessToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Refresh token rotation', () => {
    it('should invalidate old refresh token after successful refresh', async () => {
      const oldRefreshToken = jwt.sign(
        {
          sub: testUsers.manager.id,
          type: 'refresh',
          tokenId: 'old-token-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      const mockUser = {
        id: testUsers.manager.id,
        email: testUsers.manager.email,
        fullName: testUsers.manager.fullName,
        role: UserRole.MANAGER,
        isActive: true,
      };

      const mockStoredToken = {
        id: 'old-token-123',
        userId: testUsers.manager.id,
        token: oldRefreshToken,
      };

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (userService.updateRefreshTokenLastUsed as jest.Mock).mockResolvedValue(undefined);
      (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      // First refresh - should succeed
      const response1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(response1.status).toBe(200);
      const newRefreshToken = response1.body.refreshToken;

      // Reset mock for second attempt
      (userService.findRefreshToken as jest.Mock).mockResolvedValue(null);

      // Try to use old refresh token again - should fail
      const response2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(response2.status).toBe(401);
      expect(response2.body.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should update last used timestamp', async () => {
      const refreshToken = jwt.sign(
        {
          sub: testUsers.technician.id,
          type: 'refresh',
          tokenId: 'token-456',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      const mockUser = {
        id: testUsers.technician.id,
        email: testUsers.technician.email,
        role: UserRole.TECHNICIAN,
        isActive: true,
      };

      const mockStoredToken = {
        id: 'token-456',
        userId: testUsers.technician.id,
        token: refreshToken,
      };

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (userService.updateRefreshTokenLastUsed as jest.Mock).mockResolvedValue(undefined);
      (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(userService.updateRefreshTokenLastUsed).toHaveBeenCalledWith('token-456');
    });
  });

  describe('Token payload preservation', () => {
    it('should preserve user role in new tokens', async () => {
      const roles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.HSE_OFFICER];

      for (const role of roles) {
        const refreshToken = jwt.sign(
          {
            sub: `${role}-user-id`,
            type: 'refresh',
            tokenId: `${role}-token`,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          },
          jwtRefreshSecret
        );

        const mockUser = {
          id: `${role}-user-id`,
          email: `${role.toLowerCase()}@test.com`,
          role: role,
          isActive: true,
        };

        const mockStoredToken = {
          id: `${role}-token`,
          userId: `${role}-user-id`,
          token: refreshToken,
        };

        (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
        (userService.findUserById as jest.Mock).mockResolvedValue(mockUser);
        (userService.updateRefreshTokenLastUsed as jest.Mock).mockResolvedValue(undefined);
        (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);
        (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe(role);

        // Decode new access token to verify role
        const decodedToken = jwt.decode(response.body.token) as any;
        expect(decodedToken.role).toBe(role);
      }
    });

    it('should include updated user information in new tokens', async () => {
      const refreshToken = jwt.sign(
        {
          sub: testUsers.admin.id,
          type: 'refresh',
          tokenId: 'token-789',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        jwtRefreshSecret
      );

      // Mock user with updated information
      const mockUser = {
        id: testUsers.admin.id,
        email: 'newemail@example.com', // Changed email
        fullName: 'Updated Admin Name', // Changed name
        role: UserRole.ADMIN,
        companyId: 'new-company-id', // Changed company
        isActive: true,
        avatarUrl: 'https://example.com/avatar.jpg', // New avatar
        preferences: {
          theme: 'dark', // Changed theme
          language: 'es', // Changed language
          notifications: {
            email: false,
            push: true,
            inApp: true,
          },
        },
      };

      const mockStoredToken = {
        id: 'token-789',
        userId: testUsers.admin.id,
        token: refreshToken,
      };

      (userService.findRefreshToken as jest.Mock).mockResolvedValue(mockStoredToken);
      (userService.findUserById as jest.Mock).mockResolvedValue(mockUser);
      (userService.updateRefreshTokenLastUsed as jest.Mock).mockResolvedValue(undefined);
      (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      
      // Verify updated user information
      expect(response.body.user.email).toBe('newemail@example.com');
      expect(response.body.user.fullName).toBe('Updated Admin Name');
      expect(response.body.user.companyId).toBe('new-company-id');
      
      // Decode new access token to verify updated information
      const decodedToken = jwt.decode(response.body.token) as any;
      expect(decodedToken.email).toBe('newemail@example.com');
      expect(decodedToken.companyId).toBe('new-company-id');
    });
  });
});