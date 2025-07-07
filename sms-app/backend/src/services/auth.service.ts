import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { dbGet, dbRun } from '../config/database.abstraction';

// Token configurations
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  companyId: number;
  companySlug: string;
}

export interface RefreshTokenData {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
}

export class AuthService {
  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'sms-api',
      audience: 'sms-client'
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Save refresh token to database
   */
  static async saveRefreshToken(userId: number, token: string): Promise<void> {
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Save to database
    await dbRun(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [userId, token, expiresAt.toISOString()]);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'sms-api',
        audience: 'sms-client'
      }) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const refreshToken = await dbGet<RefreshTokenData>(`
      SELECT * FROM refresh_tokens
      WHERE token = ? 
        AND expires_at > datetime('now')
        AND revoked = 0
    `, [token]);

    return refreshToken || null;
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    await dbRun(`
      UPDATE refresh_tokens 
      SET revoked = 1 
      WHERE token = ?
    `, [token]);
  }

  /**
   * Revoke all user's refresh tokens
   */
  static async revokeAllUserTokens(userId: number): Promise<void> {
    await dbRun(`
      UPDATE refresh_tokens 
      SET revoked = 1 
      WHERE user_id = ? AND revoked = 0
    `, [userId]);
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    await dbRun(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < datetime('now') 
        OR revoked = 1
    `);
  }

  /**
   * Generate both access and refresh tokens
   */
  static async generateTokenPair(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      companySlug: user.company_slug
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();

    // Save refresh token to database
    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }
}