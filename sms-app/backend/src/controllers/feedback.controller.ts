import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database.abstraction';
import nodemailer from 'nodemailer';

// Create feedback table if it doesn't exist
export const initializeFeedbackTable = async () => {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      user_name TEXT,
      user_role TEXT,
      company_name TEXT,
      category TEXT NOT NULL,
      feedback TEXT NOT NULL,
      page TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
};

// Submit feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const {
      feedback,
      category,
      page,
      userAgent,
      user
    } = req.body;

    const userId = (req as any).user?.id;

    // Validate input
    if (!feedback || !category) {
      return res.status(400).json({ 
        error: 'Feedback and category are required' 
      });
    }

    // Insert feedback
    await dbRun(
      `INSERT INTO feedback (
        user_id, user_email, user_name, user_role, company_name,
        category, feedback, page, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || user?.id || null,
        user?.email || 'anonymous',
        user?.name || 'Anonymous User',
        user?.role || 'unknown',
        user?.company || 'Unknown Company',
        category,
        feedback,
        page || 'unknown',
        userAgent || 'unknown'
      ]
    );

    // Send email notification if configured
    if (process.env.FEEDBACK_EMAIL) {
      await sendFeedbackEmail({
        from: user?.email || 'anonymous',
        category,
        feedback,
        page,
        company: user?.company || 'Unknown'
      });
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback' 
    });
  }
};

// Get all feedback (admin only)
export const getFeedback = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    // Only admins can view all feedback
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const { status = 'all', category = 'all' } = req.query;

    let query = 'SELECT * FROM feedback WHERE 1=1';
    const params: any[] = [];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const feedback = await dbAll(query, params);

    res.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve feedback' 
    });
  }
};

// Update feedback status (admin only)
export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    await dbRun(
      'UPDATE feedback SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Feedback status updated'
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to update feedback' 
    });
  }
};

// Send feedback email notification
async function sendFeedbackEmail(data: any) {
  try {
    // Only send if email is configured
    if (!process.env.SMTP_HOST || !process.env.FEEDBACK_EMAIL) {
      console.log('Email not configured, skipping feedback notification');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@smartmaintenancesystems.com',
      to: process.env.FEEDBACK_EMAIL,
      subject: `[SMS Feedback] ${data.category} - ${data.company}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>From:</strong> ${data.from}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Page:</strong> ${data.page}</p>
        <hr>
        <p><strong>Feedback:</strong></p>
        <p>${data.feedback}</p>
      `
    });
  } catch (error) {
    console.error('Failed to send feedback email:', error);
  }
}