import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbGet, dbRun } from '../config/database.abstraction';
import { authMiddleware, getDashboardForUser, AuthRequest } from '../middleware/auth.middleware';
import { emailService } from '../services/email.service';
import { AuthService } from '../services/auth.service';

const router = Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with company info
    const user = await dbGet(`
      SELECT 
        u.*,
        c.name as company_name,
        c.slug as company_slug,
        c.logo_url as company_logo,
        c.primary_color,
        c.secondary_color
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.email = ? AND u.is_active = 1
    `, [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (for demo, we'll skip actual verification)
    // In production: const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = password === 'demo123' || password === 'password123'; // Demo passwords

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate token pair (access + refresh)
    const { accessToken, refreshToken } = await AuthService.generateTokenPair(user);

    // Remove sensitive data
    delete user.password_hash;

    // Get the appropriate dashboard URL for the user
    const dashboardUrl = getDashboardForUser(user.email, user.role);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        company: {
          id: user.company_id,
          name: user.company_name,
          slug: user.company_slug,
          logoUrl: user.company_logo,
          primaryColor: user.primary_color,
          secondaryColor: user.secondary_color
        },
        dashboardUrl: dashboardUrl
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Get user data
    const user = await dbGet(`
      SELECT 
        u.*,
        c.name as company_name,
        c.slug as company_slug,
        c.logo_url as company_logo,
        c.primary_color,
        c.secondary_color
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.id = ? AND u.is_active = 1
    `, [req.user!.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    delete user.password_hash;

    // Get the appropriate dashboard URL for the user
    const dashboardUrl = getDashboardForUser(user.email, user.role);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      company: {
        id: user.company_id,
        name: user.company_name,
        slug: user.company_slug,
        logoUrl: user.company_logo,
        primaryColor: user.primary_color,
        secondaryColor: user.secondary_color
      },
      dashboardUrl: dashboardUrl
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side will remove token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await dbGet('SELECT id, email, first_name FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await dbRun(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await dbRun(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt.toISOString()]
    );

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions.' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset request
    const resetRequest = await dbGet(`
      SELECT pr.*, u.email 
      FROM password_resets pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token_hash = ? 
        AND pr.expires_at > datetime('now')
        AND pr.used = 0
    `, [hashedToken]);

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, resetRequest.user_id]
    );

    // Mark token as used
    await dbRun(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [resetRequest.id]
    );

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get user notification settings
router.get('/user/settings', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const settings = await dbGet(`
      SELECT 
        notify_critical_faults,
        notify_maintenance_reminders,
        notify_fault_resolutions,
        theme,
        date_format,
        time_format,
        default_vessel_id,
        equipment_view,
        equipment_sort,
        show_decommissioned,
        notification_sound,
        desktop_notifications,
        sms_notifications,
        phone_number
      FROM users
      WHERE id = ?
    `, userId);

    res.json(settings || {
      notify_critical_faults: true,
      notify_maintenance_reminders: true,
      notify_fault_resolutions: true,
      theme: 'dark',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      default_vessel_id: null,
      equipment_view: 'grid',
      equipment_sort: 'name',
      show_decommissioned: false,
      notification_sound: true,
      desktop_notifications: true,
      sms_notifications: false,
      phone_number: null
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user notification settings
router.put('/user/settings', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const {
      notify_critical_faults,
      notify_maintenance_reminders,
      notify_fault_resolutions,
      theme,
      date_format,
      time_format,
      default_vessel_id,
      equipment_view,
      equipment_sort,
      show_decommissioned,
      notification_sound,
      desktop_notifications,
      sms_notifications,
      phone_number
    } = (req as any).body;

    await dbRun(`
      UPDATE users 
      SET 
        notify_critical_faults = ?,
        notify_maintenance_reminders = ?,
        notify_fault_resolutions = ?,
        theme = ?,
        date_format = ?,
        time_format = ?,
        default_vessel_id = ?,
        equipment_view = ?,
        equipment_sort = ?,
        show_decommissioned = ?,
        notification_sound = ?,
        desktop_notifications = ?,
        sms_notifications = ?,
        phone_number = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      notify_critical_faults ? 1 : 0,
      notify_maintenance_reminders ? 1 : 0,
      notify_fault_resolutions ? 1 : 0,
      theme || 'dark',
      date_format || 'MM/DD/YYYY',
      time_format || '12h',
      default_vessel_id || null,
      equipment_view || 'grid',
      equipment_sort || 'name',
      show_decommissioned ? 1 : 0,
      notification_sound ? 1 : 0,
      desktop_notifications ? 1 : 0,
      sms_notifications ? 1 : 0,
      phone_number || null,
      userId
    ]);

    res.json({ message: 'Settings updated successfully' });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRequest = await dbGet(`
      SELECT id FROM password_resets
      WHERE token_hash = ? 
        AND expires_at > datetime('now')
        AND used = 0
    `, [hashedToken]);

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ valid: true });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const tokenData = await AuthService.verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user data
    const user = await dbGet(`
      SELECT 
        u.*,
        c.slug as company_slug
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.id = ? AND u.is_active = 1
    `, [tokenData.user_id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Revoke old refresh token
    await AuthService.revokeRefreshToken(refreshToken);

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.generateTokenPair(user);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = (req as any).body;

    if (refreshToken) {
      // Revoke the specific refresh token
      await AuthService.revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    // Even if revocation fails, we consider logout successful
    res.json({ message: 'Logged out successfully' });
  }
});

// Logout from all devices
router.post('/logout-all', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Revoke all user's refresh tokens
    await AuthService.revokeAllUserTokens(userId);

    res.json({ message: 'Logged out from all devices successfully' });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

export default router;