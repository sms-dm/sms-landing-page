// Login/Logout flow integration tests
import request from 'supertest';
import express, { Express } from 'express';
import { testUsers, loginTestUser, makeAuthenticatedRequest, decodeToken } from './test-utils';
import authRoutes from '../../../api/routes/auth.routes';
import { authenticate } from '../../../api/middleware/auth.middleware';
import { userService } from '../../../services/user.service';

// Mock the user service
jest.mock('../../../services/user.service');
jest.mock('../../../services/email.service');

describe('Authentication Flow - Login/Logout', () => {
  let app: Express;
  
  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        password: '$2b$10$hashedpassword', // Mocked hash
        fullName: testUsers.admin.fullName,
        role: testUsers.admin.role,
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

      // Mock user service methods
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (userService.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.admin.email);
      expect(response.body.user.role).toBe(testUsers.admin.role);
      expect(response.body).not.toHaveProperty('user.password');
    });

    it('should fail login with invalid email', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('LOGIN_FAILED');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should fail login with invalid password', async () => {
      const mockUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        password: '$2b$10$hashedpassword',
        isActive: true,
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('LOGIN_FAILED');
    });

    it('should fail login for inactive user', async () => {
      const mockUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        password: '$2b$10$hashedpassword',
        isActive: false,
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('USER_INACTIVE');
      expect(response.body.message).toBe('Your account has been deactivated');
    });

    it('should respect rememberMe option', async () => {
      const mockUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        password: '$2b$10$hashedpassword',
        fullName: testUsers.admin.fullName,
        role: testUsers.admin.role,
        isActive: true,
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (userService.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      // Test with rememberMe = true
      const responseWithRemember = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
          rememberMe: true,
        });

      expect(responseWithRemember.status).toBe(200);
      expect(responseWithRemember.body.expiresIn).toBe(2592000); // 30 days

      // Test with rememberMe = false
      const responseWithoutRemember = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
          rememberMe: false,
        });

      expect(responseWithoutRemember.status).toBe(200);
      expect(responseWithoutRemember.body.expiresIn).toBe(604800); // 7 days
    });

    it('should validate input fields', async () => {
      // Test missing email
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!',
        });

      expect(response1.status).toBe(400);
      expect(response1.body.code).toBe('VALIDATION_ERROR');

      // Test invalid email format
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalidemail',
          password: 'Password123!',
        });

      expect(response2.status).toBe(400);
      expect(response2.body.code).toBe('VALIDATION_ERROR');

      // Test missing password
      const response3 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response3.status).toBe(400);
      expect(response3.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout authenticated user', async () => {
      // Mock authenticated request
      const mockUser = { sub: testUsers.admin.id };
      app.use((req: any, res, next) => {
        req.user = mockUser;
        next();
      });

      (userService.deleteUserRefreshTokens as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
      expect(userService.deleteUserRefreshTokens).toHaveBeenCalledWith(testUsers.admin.id);
    });

    it('should fail logout without authentication', async () => {
      // Create a new app instance without the mock middleware
      const cleanApp = express();
      cleanApp.use(express.json());
      cleanApp.use('/api/auth', authRoutes);

      const response = await request(cleanApp)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Token validation in login response', () => {
    it('should return valid JWT tokens', async () => {
      const mockUser = {
        id: testUsers.manager.id,
        email: testUsers.manager.email,
        password: '$2b$10$hashedpassword',
        fullName: testUsers.manager.fullName,
        role: testUsers.manager.role,
        companyId: 'test-company-id',
        isActive: true,
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (userService.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (userService.createRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.manager.email,
          password: testUsers.manager.password,
        });

      expect(response.status).toBe(200);
      
      // Decode and verify token structure
      const decodedToken = decodeToken(response.body.token);
      expect(decodedToken).toHaveProperty('sub', mockUser.id);
      expect(decodedToken).toHaveProperty('email', mockUser.email);
      expect(decodedToken).toHaveProperty('role', mockUser.role);
      expect(decodedToken).toHaveProperty('companyId', mockUser.companyId);
      expect(decodedToken).toHaveProperty('iat');
      expect(decodedToken).toHaveProperty('exp');

      // Verify token expiration is in the future
      const now = Math.floor(Date.now() / 1000);
      expect(decodedToken.exp).toBeGreaterThan(now);
    });
  });
});