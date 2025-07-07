// User service for database operations
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, RefreshToken, PasswordResetToken } from '../types/auth';
import { config } from '../config';
import { mockUserService } from './user.service.mock';

// Use mock service if in demo mode or if Prisma is not available
let prisma: any;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.log('Prisma not available, using mock service');
}

export class UserService {
  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    companyId?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, config.auth.bcryptRounds);
    
    // Split fullName into firstName and lastName
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: data.role,
        companyId: data.companyId,
        isActive: true,
        settings: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true,
          },
        },
      },
    });
    
    // Transform to match the User interface
    return {
      ...user,
      password: user.passwordHash,
      fullName: `${user.firstName} ${user.lastName}`,
      preferences: user.settings as any,
    } as User;
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) return null;
    
    // Transform to match the User interface
    return {
      ...user,
      password: user.passwordHash,
      fullName: `${user.firstName} ${user.lastName}`,
      preferences: user.settings as any,
    } as User;
  }
  
  async findUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    // Transform to match the User interface
    return {
      ...user,
      password: user.passwordHash,
      fullName: `${user.firstName} ${user.lastName}`,
      preferences: user.settings as any,
    } as User;
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    // Handle fullName update
    let updateData: any = { ...data };
    if (data.fullName) {
      const nameParts = data.fullName.trim().split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
      delete updateData.fullName;
    }
    
    // Handle preferences to settings
    if (updateData.preferences) {
      updateData.settings = updateData.preferences;
      delete updateData.preferences;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
    
    // Transform to match the User interface
    return {
      ...user,
      password: user.passwordHash,
      fullName: `${user.firstName} ${user.lastName}`,
      preferences: user.settings as any,
    } as User;
  }
  
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
  
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }
  
  // Refresh token management
  async createRefreshToken(userId: string, token: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<RefreshToken> {
    const refreshToken = await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId,
        token,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });
    
    return refreshToken as RefreshToken;
  }
  
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    return refreshToken as RefreshToken | null;
  }
  
  async updateRefreshTokenLastUsed(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }
  
  async deleteRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { id },
    });
  }
  
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
  
  async deleteExpiredRefreshTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
  
  // Password reset token management
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    await prisma.passwordResetToken.create({
      data: {
        id: uuidv4(),
        userId,
        token,
        expiresAt,
      },
    });
    
    return token;
  }
  
  async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
    });
    
    return resetToken as PasswordResetToken | null;
  }
  
  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }
  
  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            usedAt: {
              not: null,
            },
          },
        ],
      },
    });
  }
}

// Export the appropriate service based on configuration
export const userService = (config.demo.enabled || !prisma) ? mockUserService : new UserService();