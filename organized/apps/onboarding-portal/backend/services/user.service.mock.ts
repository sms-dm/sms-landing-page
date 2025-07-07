// Mock user service for demo mode
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, RefreshToken, PasswordResetToken } from '../types/auth';
import { config } from '../config';

// In-memory storage for demo mode
const users: Map<string, User> = new Map();
const refreshTokens: Map<string, RefreshToken> = new Map();
const passwordResetTokens: Map<string, PasswordResetToken> = new Map();

// Initialize demo users
async function initDemoUsers() {
  for (const demoUser of config.demo.users) {
    const hashedPassword = await bcrypt.hash(demoUser.password, config.auth.bcryptRounds);
    const userId = uuidv4();
    const user: User = {
      id: userId,
      email: demoUser.email,
      password: hashedPassword,
      fullName: demoUser.fullName,
      role: demoUser.role as UserRole,
      companyId: uuidv4(),
      isActive: true,
      avatarUrl: null,
      phoneNumber: null,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          inApp: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.set(user.email, user);
  }
}

// Initialize demo users on module load
if (config.demo.enabled) {
  initDemoUsers();
}

export class MockUserService {
  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    companyId?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, config.auth.bcryptRounds);
    
    const user: User = {
      id: uuidv4(),
      email: data.email.toLowerCase(),
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      companyId: data.companyId || uuidv4(),
      isActive: true,
      avatarUrl: null,
      phoneNumber: null,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          inApp: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.set(user.email, user);
    return user;
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    return users.get(email.toLowerCase()) || null;
  }
  
  async findUserById(id: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    
    users.set(user.email, updatedUser);
    return updatedUser;
  }
  
  async updateLastLogin(id: string): Promise<void> {
    const user = await this.findUserById(id);
    if (user) {
      user.lastLoginAt = new Date();
      users.set(user.email, user);
    }
  }
  
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
    user.password = hashedPassword;
    user.updatedAt = new Date();
    users.set(user.email, user);
  }
  
  // Refresh token management
  async createRefreshToken(userId: string, token: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<RefreshToken> {
    const refreshToken: RefreshToken = {
      id: uuidv4(),
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      userAgent,
      ipAddress,
    };
    
    refreshTokens.set(token, refreshToken);
    return refreshToken;
  }
  
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = refreshTokens.get(token);
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      return null;
    }
    return refreshToken;
  }
  
  async updateRefreshTokenLastUsed(id: string): Promise<void> {
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.id === id) {
        refreshToken.lastUsedAt = new Date();
        refreshTokens.set(token, refreshToken);
        break;
      }
    }
  }
  
  async deleteRefreshToken(id: string): Promise<void> {
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.id === id) {
        refreshTokens.delete(token);
        break;
      }
    }
  }
  
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.userId === userId) {
        refreshTokens.delete(token);
      }
    }
  }
  
  async deleteExpiredRefreshTokens(): Promise<void> {
    const now = new Date();
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.expiresAt < now) {
        refreshTokens.delete(token);
      }
    }
  }
  
  // Password reset token management
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    const resetToken: PasswordResetToken = {
      id: uuidv4(),
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    };
    
    passwordResetTokens.set(token, resetToken);
    return token;
  }
  
  async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = passwordResetTokens.get(token);
    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      return null;
    }
    return resetToken;
  }
  
  async markPasswordResetTokenUsed(id: string): Promise<void> {
    for (const [token, resetToken] of passwordResetTokens.entries()) {
      if (resetToken.id === id) {
        resetToken.usedAt = new Date();
        passwordResetTokens.set(token, resetToken);
        break;
      }
    }
  }
  
  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = new Date();
    for (const [token, resetToken] of passwordResetTokens.entries()) {
      if (resetToken.expiresAt < now || resetToken.usedAt) {
        passwordResetTokens.delete(token);
      }
    }
  }
}

export const mockUserService = new MockUserService();