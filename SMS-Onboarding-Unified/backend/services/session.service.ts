// Session cleanup service
import { userService } from './user.service';
import { config } from '../config';

export class SessionService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Start periodic cleanup
  startCleanup(intervalMs: number = 60 * 60 * 1000) { // Default: 1 hour
    if (this.cleanupInterval) {
      this.stopCleanup();
    }

    // Run cleanup immediately
    this.cleanupExpiredTokens();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, intervalMs);

    console.log(`Session cleanup service started with interval: ${intervalMs}ms`);
  }

  // Stop cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session cleanup service stopped');
    }
  }

  // Cleanup expired tokens
  private async cleanupExpiredTokens() {
    try {
      console.log('Running session cleanup...');
      
      // Clean expired refresh tokens
      await userService.deleteExpiredRefreshTokens();
      
      // Clean expired password reset tokens
      await userService.deleteExpiredPasswordResetTokens();
      
      console.log('Session cleanup completed');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  // Validate session
  async validateSession(userId: string, token: string): Promise<boolean> {
    try {
      const refreshToken = await userService.findRefreshToken(token);
      
      if (!refreshToken || refreshToken.userId !== userId) {
        return false;
      }

      // Check if token is expired
      if (refreshToken.expiresAt < new Date()) {
        await userService.deleteRefreshToken(refreshToken.id);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Revoke all sessions for user
  async revokeUserSessions(userId: string): Promise<void> {
    try {
      await userService.deleteUserRefreshTokens(userId);
      console.log(`All sessions revoked for user: ${userId}`);
    } catch (error) {
      console.error('Session revocation error:', error);
      throw error;
    }
  }

  // Get active sessions for user
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      // This would need to be implemented in userService
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }
}

export const sessionService = new SessionService();

// Start cleanup service if not in test environment
if (process.env.NODE_ENV !== 'test') {
  sessionService.startCleanup();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  sessionService.stopCleanup();
});

process.on('SIGINT', () => {
  sessionService.stopCleanup();
});