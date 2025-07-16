import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { emailQueueService } from '../services/email-queue.service';
import { activationCodeService } from '../services/activation-code.service';
import { dbGet } from '../config/database';

const router = Router();

// Get email queue statistics
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await emailQueueService.getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting email queue stats:', error);
    res.status(500).json({ error: 'Failed to get email queue statistics' });
  }
});

// Send test activation code (admin only)
router.post('/activation/test', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { companyId, email, name } = req.body;

    if (!companyId || !email || !name) {
      return res.status(400).json({ 
        error: 'Company ID, email, and name are required' 
      });
    }

    // Send activation code
    await activationCodeService.sendActivationCode(
      companyId,
      email,
      name
    );

    res.json({ 
      message: 'Activation code email queued successfully',
      email 
    });
  } catch (error) {
    console.error('Error sending test activation code:', error);
    res.status(500).json({ error: 'Failed to send activation code' });
  }
});

// Regenerate activation code
router.post('/activation/regenerate', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { companyId, reason, extendTrial } = req.body;

    if (!companyId || !reason) {
      return res.status(400).json({ 
        error: 'Company ID and reason are required' 
      });
    }

    const newCode = await activationCodeService.regenerateActivationCode(
      companyId,
      reason,
      extendTrial || false
    );

    res.json({ 
      message: 'Activation code regenerated successfully',
      code: newCode 
    });
  } catch (error) {
    console.error('Error regenerating activation code:', error);
    res.status(500).json({ error: 'Failed to regenerate activation code' });
  }
});

// Validate activation code (public endpoint)
router.post('/activation/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Activation code is required' });
    }

    const result = await activationCodeService.validateActivationCode(code);
    
    if (!result.valid) {
      return res.status(400).json({ 
        valid: false,
        error: result.error 
      });
    }

    // Get company details
    const company = await dbGet(
      'SELECT id, name, slug FROM companies WHERE id = ?',
      [result.companyId]
    );

    res.json({ 
      valid: true,
      company 
    });
  } catch (error) {
    console.error('Error validating activation code:', error);
    res.status(500).json({ error: 'Failed to validate activation code' });
  }
});

// Activate code (public endpoint)
router.post('/activation/activate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Activation code is required' });
    }

    // Validate first
    const validation = await activationCodeService.validateActivationCode(code);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Activate the code
    await activationCodeService.activateCode(code);

    res.json({ 
      message: 'Activation code successfully activated',
      companyId: validation.companyId 
    });
  } catch (error) {
    console.error('Error activating code:', error);
    res.status(500).json({ error: 'Failed to activate code' });
  }
});

// Send team invitation
router.post('/invitation/send', authenticateToken, async (req, res) => {
  try {
    const { 
      inviteeName, 
      inviteeEmail, 
      role,
      invitationToken 
    } = req.body;

    if (!inviteeEmail || !role) {
      return res.status(400).json({ 
        error: 'Email and role are required' 
      });
    }

    // Get company details
    const company = await dbGet(
      'SELECT name FROM companies WHERE id = ?',
      [req.user.companyId]
    );

    // Get vessel count
    const vesselCount = await dbGet(
      'SELECT COUNT(*) as count FROM vessels WHERE company_id = ?',
      [req.user.companyId]
    );

    await activationCodeService.sendTeamInvitation({
      inviteeName: inviteeName || '',
      inviteeEmail,
      inviterName: `${req.user.firstName} ${req.user.lastName}`,
      companyName: company.name,
      role,
      invitationToken,
      vesselCount: vesselCount.count
    });

    res.json({ 
      message: 'Team invitation sent successfully',
      email: inviteeEmail 
    });
  } catch (error) {
    console.error('Error sending team invitation:', error);
    res.status(500).json({ error: 'Failed to send team invitation' });
  }
});

// Manually trigger email queue processing (admin only)
router.post('/queue/process', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await emailQueueService.processQueue();
    
    res.json({ message: 'Email queue processed' });
  } catch (error) {
    console.error('Error processing email queue:', error);
    res.status(500).json({ error: 'Failed to process email queue' });
  }
});

// Retry failed emails (admin only)
router.post('/queue/retry', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { olderThanMinutes = 60 } = req.body;
    const count = await emailQueueService.retryFailed(olderThanMinutes);
    
    res.json({ 
      message: 'Failed emails marked for retry',
      count 
    });
  } catch (error) {
    console.error('Error retrying failed emails:', error);
    res.status(500).json({ error: 'Failed to retry emails' });
  }
});

export default router;