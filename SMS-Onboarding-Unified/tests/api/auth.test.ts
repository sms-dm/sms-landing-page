// Authentication API Tests
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

describe('Authentication API', () => {
  let api: AxiosInstance;
  let authToken: string;
  let refreshToken: string;

  beforeAll(() => {
    api = axios.create({
      baseURL: API_BASE_URL,
      validateStatus: () => true, // Don't throw on any status
    });
  });

  describe('POST /auth/register', () => {
    test('should register a new user', async () => {
      const response = await api.post('/auth/register', {
        email: `test.${Date.now()}@example.com`,
        password: 'Test123!@#',
        fullName: 'Test User',
        role: 'TECHNICIAN',
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data.user.email).toBeDefined();
      expect(response.data.user.role).toBe('TECHNICIAN');
    });

    test('should fail with weak password', async () => {
      const response = await api.post('/auth/register', {
        email: 'test@example.com',
        password: 'weak',
        fullName: 'Test User',
        role: 'TECHNICIAN',
      });

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('VALIDATION_ERROR');
    });

    test('should fail with invalid email', async () => {
      const response = await api.post('/auth/register', {
        email: 'invalid-email',
        password: 'Test123!@#',
        fullName: 'Test User',
        role: 'TECHNICIAN',
      });

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('VALIDATION_ERROR');
    });

    test('should fail with duplicate email', async () => {
      const email = `duplicate.${Date.now()}@example.com`;
      
      // First registration
      await api.post('/auth/register', {
        email,
        password: 'Test123!@#',
        fullName: 'Test User',
        role: 'TECHNICIAN',
      });

      // Duplicate registration
      const response = await api.post('/auth/register', {
        email,
        password: 'Test123!@#',
        fullName: 'Test User 2',
        role: 'TECHNICIAN',
      });

      expect(response.status).toBe(409);
      expect(response.data.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@demo.com',
        password: 'Demo123!',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('refreshToken');
      
      authToken = response.data.token;
      refreshToken = response.data.refreshToken;
    });

    test('should fail with invalid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@demo.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.data.code).toBe('LOGIN_FAILED');
    });

    test('should support remember me option', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@demo.com',
        password: 'Demo123!',
        rememberMe: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.expiresIn).toBe(2592000); // 30 days
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh access token', async () => {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data.token).not.toBe(authToken);
    });

    test('should fail with invalid refresh token', async () => {
      const response = await api.post('/auth/refresh', {
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.data.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('GET /auth/me', () => {
    test('should get current user with valid token', async () => {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email');
      expect(response.data).toHaveProperty('role');
    });

    test('should fail without token', async () => {
      const response = await api.get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    test('should fail with invalid token', async () => {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      expect(response.data.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /auth/change-password', () => {
    test('should change password with valid current password', async () => {
      const response = await api.post('/auth/change-password', {
        currentPassword: 'Demo123!',
        newPassword: 'NewDemo123!',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Password changed successfully');
    });

    test('should fail with incorrect current password', async () => {
      const response = await api.post('/auth/change-password', {
        currentPassword: 'wrongpassword',
        newPassword: 'NewDemo123!',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(401);
      expect(response.data.code).toBe('INVALID_PASSWORD');
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Logged out successfully');
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      const email = `ratelimit.${Date.now()}@example.com`;
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await api.post('/auth/login', {
          email,
          password: 'wrongpassword',
        });
      }

      // 6th attempt should be rate limited
      const response = await api.post('/auth/login', {
        email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(429);
      expect(response.data.message).toContain('Too many login attempts');
    });
  });

  describe('Role-Based Access', () => {
    test('should login as different roles', async () => {
      const roles = [
        { email: 'admin@demo.com', role: 'ADMIN' },
        { email: 'manager@demo.com', role: 'MANAGER' },
        { email: 'tech@demo.com', role: 'TECHNICIAN' },
        { email: 'hse@demo.com', role: 'HSE_OFFICER' },
      ];

      for (const { email, role } of roles) {
        const response = await api.post('/auth/login', {
          email,
          password: 'Demo123!',
        });

        expect(response.status).toBe(200);
        expect(response.data.user.role).toBe(role);
      }
    });
  });
});

// Run tests with: npm test auth.test.ts