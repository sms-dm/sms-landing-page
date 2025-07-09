// Authentication controller - full implementation
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { UserRole, JWTPayload, RefreshTokenPayload } from '../../types/auth';
import { userService } from '../../services/user.service';
import { emailService } from '../../services/email.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, role, companyName, inviteToken } = req.body;

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
      });
      return;
    }

    // TODO: Validate invite token if provided
    // TODO: Create company if companyName provided and user is ADMIN

    // Create user
    const user = await userService.createUser({
      email,
      password,
      fullName,
      role: role as UserRole,
      companyId: undefined, // Set based on company creation or invite token
    });

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshTokenStr = generateRefreshToken(user);
    
    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    await userService.createRefreshToken(
      user.id,
      refreshTokenStr,
      expiresAt,
      req.headers['user-agent'],
      req.ip
    );

    // Send welcome email with logo
    await emailService.sendWelcomeEmail({
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role,
      companyName: companyName || 'SMS Platform',
      verificationLink: `${config.APP_URL}/verify-email?token=${token}`,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
      token,
      refreshToken: refreshTokenStr,
      expiresIn: 604800, // 7 days in seconds
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      code: 'REGISTRATION_ERROR',
      message: 'Failed to register user',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Demo mode handling
    if (config.demo.enabled) {
      const demoUser = config.demo.users.find(u => u.email === email);
      if (demoUser && password === demoUser.password) {
        const user = {
          id: uuidv4(),
          email: demoUser.email,
          fullName: demoUser.fullName,
          role: demoUser.role as UserRole,
          companyId: uuidv4(),
          isActive: true,
          avatarUrl: null,
          preferences: {
            theme: 'light' as const,
            language: 'en',
            notifications: {
              email: true,
              push: true,
              inApp: true,
            },
          },
        };

        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
          user,
          token,
          refreshToken,
          expiresIn: rememberMe ? 2592000 : 604800,
        });
        return;
      }
    }

    // Find user in database
    const user = await userService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        code: 'LOGIN_FAILED',
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isValidPassword = await userService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        code: 'LOGIN_FAILED',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        code: 'USER_INACTIVE',
        message: 'Your account has been deactivated',
      });
      return;
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshTokenStr = generateRefreshToken(user);
    
    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));
    
    await userService.createRefreshToken(
      user.id,
      refreshTokenStr,
      expiresAt,
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
      token,
      refreshToken: refreshTokenStr,
      expiresIn: rememberMe ? 2592000 : 604800, // 30 days or 7 days
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 'LOGIN_ERROR',
      message: 'An error occurred during login',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, config.auth.jwtRefreshSecret!) as RefreshTokenPayload;
    } catch (error) {
      res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Check if refresh token exists in database
    const storedToken = await userService.findRefreshToken(refreshToken);
    if (!storedToken) {
      res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Get user
    const user = await userService.findUserById(decoded.sub);
    if (!user || !user.isActive) {
      res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found or inactive',
      });
      return;
    }

    // Update last used timestamp
    await userService.updateRefreshTokenLastUsed(storedToken.id);

    // Generate new tokens (rotation)
    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Delete old refresh token
    await userService.deleteRefreshToken(storedToken.id);

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await userService.createRefreshToken(
      user.id,
      newRefreshToken,
      expiresAt,
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 604800,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      code: 'REFRESH_TOKEN_ERROR',
      message: 'Failed to refresh token',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;

    // Remove all refresh tokens for this user
    await userService.deleteUserRefreshTokens(userId);

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      code: 'LOGOUT_ERROR',
      message: 'Failed to logout',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await userService.findUserByEmail(email);
    
    // Always return success even if user doesn't exist (security)
    if (!user) {
      res.json({
        message: 'Password reset email sent if account exists',
      });
      return;
    }

    // Generate password reset token
    const resetToken = await userService.createPasswordResetToken(user.id);

    // Send password reset email with logo
    const resetLink = `${config.APP_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.fullName,
      resetLink,
    });

    res.json({
      message: 'Password reset email sent if account exists',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      code: 'FORGOT_PASSWORD_ERROR',
      message: 'Failed to process password reset request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    const resetToken = await userService.findPasswordResetToken(token);
    if (!resetToken) {
      res.status(400).json({
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Update user password
    await userService.changePassword(resetToken.userId, newPassword);

    // Mark token as used
    await userService.markPasswordResetTokenUsed(resetToken.id);

    // Delete all refresh tokens for security
    await userService.deleteUserRefreshTokens(resetToken.userId);

    res.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      code: 'RESET_PASSWORD_ERROR',
      message: 'Failed to reset password',
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;

    // Fetch full user details from database
    const user = await userService.findUserById(userId);
    if (!user) {
      res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      code: 'USER_FETCH_ERROR',
      message: 'Failed to fetch user details',
    });
  }
};

export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const updates = req.body;

    // Remove fields that shouldn't be updated through this endpoint
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.companyId;
    delete updates.isActive;

    // Update user
    const updatedUser = await userService.updateUser(userId, updates);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      avatarUrl: updatedUser.avatarUrl,
      phoneNumber: updatedUser.phoneNumber,
      isActive: updatedUser.isActive,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLoginAt: updatedUser.lastLoginAt,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      code: 'USER_UPDATE_ERROR',
      message: 'Failed to update user',
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await userService.findUserById(userId);
    if (!user) {
      res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await userService.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    await userService.changePassword(userId, newPassword);

    // Delete all refresh tokens for security
    await userService.deleteUserRefreshTokens(userId);

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      code: 'PASSWORD_CHANGE_ERROR',
      message: 'Failed to change password',
    });
  }
};

// Helper functions
function generateAccessToken(user: any): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };

  return jwt.sign(payload, config.auth.jwtSecret!);
}

function generateRefreshToken(user: any): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    type: 'refresh',
    tokenId: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };

  return jwt.sign(payload, config.auth.jwtRefreshSecret || config.auth.jwtSecret!);
}