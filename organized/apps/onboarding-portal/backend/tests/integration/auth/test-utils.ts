// Test utilities for authentication tests
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { UserRole } from '../../../types/auth';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  token?: string;
  refreshToken?: string;
}

// Test users for different roles
export const testUsers: Record<string, TestUser> = {
  admin: {
    id: 'admin-test-id',
    email: 'admin.test@example.com',
    password: 'AdminTest123!',
    fullName: 'Test Admin',
    role: UserRole.ADMIN,
  },
  manager: {
    id: 'manager-test-id',
    email: 'manager.test@example.com',
    password: 'ManagerTest123!',
    fullName: 'Test Manager',
    role: UserRole.MANAGER,
  },
  technician: {
    id: 'tech-test-id',
    email: 'tech.test@example.com',
    password: 'TechTest123!',
    fullName: 'Test Technician',
    role: UserRole.TECHNICIAN,
  },
  hseOfficer: {
    id: 'hse-test-id',
    email: 'hse.test@example.com',
    password: 'HseTest123!',
    fullName: 'Test HSE Officer',
    role: UserRole.HSE_OFFICER,
  },
};

// Helper to register a test user
export async function registerTestUser(
  app: Express,
  user: TestUser
): Promise<{ token: string; refreshToken: string }> {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
    });

  return {
    token: response.body.token,
    refreshToken: response.body.refreshToken,
  };
}

// Helper to login a test user
export async function loginTestUser(
  app: Express,
  email: string,
  password: string,
  rememberMe = false
): Promise<{ token: string; refreshToken: string; user: any }> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password,
      rememberMe,
    });

  return {
    token: response.body.token,
    refreshToken: response.body.refreshToken,
    user: response.body.user,
  };
}

// Helper to make authenticated request
export function makeAuthenticatedRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string
) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

// Helper to verify JWT token
export function verifyToken(token: string, secret: string): any {
  return jwt.verify(token, secret);
}

// Helper to decode JWT token without verification
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

// Helper to generate expired token
export function generateExpiredToken(userId: string, role: UserRole): string {
  const payload = {
    sub: userId,
    email: `${role.toLowerCase()}@test.com`,
    role,
    iat: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret');
}

// Helper to wait for async operations
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to clear test data (mock implementation)
export async function clearTestData(): Promise<void> {
  // In a real implementation, this would clear test data from the database
  // For now, this is a placeholder
  console.log('Clearing test data...');
}