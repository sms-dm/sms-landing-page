import crypto from 'crypto';
import { dbRun, dbGet, dbAll, beginTransaction, commitTransaction, rollbackTransaction } from '../config/database.abstraction';
import { emailService } from './email.service';

export interface ActivationCode {
  id: number;
  code: string;
  company_name: string;
  plan_type: 'starter' | 'pro' | 'enterprise';
  email: string;
  created_at: Date;
  expires_at: Date;
  used_at?: Date;
  used_by_ip?: string;
  max_uses: number;
  current_uses: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  payment_reference?: string;
  payment_amount?: number;
  payment_currency?: string;
  metadata?: any;
}

export interface PaymentWebhookData {
  provider: string;
  payment_id: string;
  payment_status: string;
  amount: number;
  currency: string;
  customer_email: string;
  customer_name?: string;
  company_name: string;
  plan_type: 'starter' | 'pro' | 'enterprise';
  webhook_event_type: string;
  webhook_payload: any;
}

export interface CodeValidationResult {
  valid: boolean;
  code?: ActivationCode;
  company?: {
    name: string;
    plan_type: string;
    email: string;
  };
  error?: string;
}

class PaymentService {
  /**
   * Generate a cryptographically secure activation code
   * Format: XXXX-XXXX-XXXX-XXXX
   */
  private generateActivationCode(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const bytes = crypto.randomBytes(2);
      const segment = bytes.toString('hex').toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  /**
   * Create an activation code after payment confirmation
   */
  async createActivationCode(data: {
    company_name: string;
    plan_type: 'starter' | 'pro' | 'enterprise';
    email: string;
    payment_reference?: string;
    payment_amount?: number;
    payment_currency?: string;
    expires_in_days?: number;
    max_uses?: number;
    metadata?: any;
  }): Promise<ActivationCode> {
    const client = await beginTransaction();

    try {
      // Generate unique code
      let code: string;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = this.generateActivationCode();
        const existing = await dbGet(
          'SELECT id FROM activation_codes WHERE code = ?',
          [code]
        );
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique activation code');
      }

      // Calculate expiration date (default 30 days)
      const expiresInDays = data.expires_in_days || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Insert activation code
      const result = await dbRun(
        `INSERT INTO activation_codes (
          code, company_name, plan_type, email, expires_at,
          max_uses, payment_reference, payment_amount, payment_currency, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code!,
          data.company_name,
          data.plan_type,
          data.email,
          expiresAt.toISOString(),
          data.max_uses || 1,
          data.payment_reference || null,
          data.payment_amount || null,
          data.payment_currency || 'USD',
          JSON.stringify(data.metadata || {})
        ]
      );

      const activationCode = await dbGet(
        'SELECT * FROM activation_codes WHERE code = ?',
        [code!]
      );

      await commitTransaction(client);

      // Send email with activation code
      await this.sendActivationCodeEmail(activationCode);

      return activationCode;
    } catch (error) {
      await rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Process payment webhook
   */
  async processPaymentWebhook(data: PaymentWebhookData): Promise<void> {
    const client = await beginTransaction();

    try {
      // Log the payment webhook
      const logResult = await dbRun(
        `INSERT INTO payment_logs (
          payment_provider, payment_id, payment_status, amount, currency,
          customer_email, customer_name, webhook_event_type, webhook_payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.provider,
          data.payment_id,
          data.payment_status,
          data.amount,
          data.currency,
          data.customer_email,
          data.customer_name || null,
          data.webhook_event_type,
          JSON.stringify(data.webhook_payload)
        ]
      );

      const paymentLogId = logResult.lastID;

      // Only process successful payments
      if (data.payment_status === 'succeeded' || data.payment_status === 'completed') {
        // Check if we've already processed this payment
        const existingCode = await dbGet(
          'SELECT id FROM activation_codes WHERE payment_reference = ?',
          [data.payment_id]
        );

        if (!existingCode) {
          // Create activation code
          const activationCode = await this.createActivationCode({
            company_name: data.company_name,
            plan_type: data.plan_type,
            email: data.customer_email,
            payment_reference: data.payment_id,
            payment_amount: data.amount,
            payment_currency: data.currency,
            metadata: {
              payment_provider: data.provider,
              customer_name: data.customer_name
            }
          });

          // Update payment log with activation code
          await dbRun(
            'UPDATE payment_logs SET activation_code_id = ?, processed = true, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [activationCode.id, paymentLogId]
          );
        } else {
          // Mark as already processed
          await dbRun(
            `UPDATE payment_logs 
             SET processed = true, 
                 processed_at = CURRENT_TIMESTAMP, 
                 processing_notes = 'Activation code already exists for this payment'
             WHERE id = ?`,
            [paymentLogId]
          );
        }
      }

      await commitTransaction(client);
    } catch (error) {
      await rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Validate an activation code
   */
  async validateActivationCode(code: string, ipAddress?: string): Promise<CodeValidationResult> {
    try {
      // Clean the code (remove spaces and convert to uppercase)
      const cleanCode = code.trim().toUpperCase().replace(/\s/g, '');

      // Get the activation code
      const activationCode = await dbGet(
        'SELECT * FROM activation_codes WHERE code = ?',
        [cleanCode]
      );

      if (!activationCode) {
        return {
          valid: false,
          error: 'Invalid activation code'
        };
      }

      // Check if expired
      if (new Date(activationCode.expires_at) < new Date()) {
        // Update status if not already marked as expired
        if (activationCode.status !== 'expired') {
          await dbRun(
            'UPDATE activation_codes SET status = ? WHERE id = ?',
            ['expired', activationCode.id]
          );
        }
        return {
          valid: false,
          error: 'Activation code has expired'
        };
      }

      // Check if already used up
      if (activationCode.status === 'used' || activationCode.current_uses >= activationCode.max_uses) {
        return {
          valid: false,
          error: 'Activation code has already been used'
        };
      }

      // Check if cancelled
      if (activationCode.status === 'cancelled') {
        return {
          valid: false,
          error: 'Activation code has been cancelled'
        };
      }

      // Code is valid
      return {
        valid: true,
        code: activationCode,
        company: {
          name: activationCode.company_name,
          plan_type: activationCode.plan_type,
          email: activationCode.email
        }
      };
    } catch (error) {
      console.error('Error validating activation code:', error);
      return {
        valid: false,
        error: 'An error occurred while validating the code'
      };
    }
  }

  /**
   * Use an activation code (mark it as used)
   */
  async useActivationCode(
    code: string, 
    companyId: number, 
    userId: number, 
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const client = await beginTransaction();

    try {
      // Validate the code first
      const validation = await this.validateActivationCode(code, ipAddress);
      if (!validation.valid || !validation.code) {
        throw new Error(validation.error || 'Invalid activation code');
      }

      // Record the usage
      await dbRun(
        `INSERT INTO activation_code_usage (
          activation_code_id, used_by_ip, user_agent, company_id, user_id
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          validation.code.id,
          ipAddress || null,
          userAgent || null,
          companyId,
          userId
        ]
      );

      await commitTransaction(client);
      return true;
    } catch (error) {
      await rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get activation code status
   */
  async getActivationCodeStatus(code: string): Promise<ActivationCode | null> {
    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '');
    
    const activationCode = await dbGet(
      'SELECT * FROM activation_codes WHERE code = ?',
      [cleanCode]
    );

    return activationCode;
  }

  /**
   * Send activation code email
   */
  private async sendActivationCodeEmail(activationCode: ActivationCode): Promise<void> {
    const planDetails = {
      starter: { vessels: 5, users: 50, price: '$299/month' },
      pro: { vessels: 10, users: 100, price: '$599/month' },
      enterprise: { vessels: 'Unlimited', users: 'Unlimited', price: 'Custom' }
    };

    const plan = planDetails[activationCode.plan_type];

    await emailService.sendEmail({
      to: activationCode.email,
      subject: 'Your SMS Portal Activation Code',
      html: `
        <h2>Welcome to Smart Maintenance Systems!</h2>
        <p>Thank you for your purchase. Your activation code is ready to use.</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Activation Code:</h3>
          <div style="font-size: 24px; font-family: monospace; letter-spacing: 2px; color: #00CED1;">
            ${activationCode.code}
          </div>
        </div>
        
        <h3>Subscription Details:</h3>
        <ul>
          <li><strong>Company:</strong> ${activationCode.company_name}</li>
          <li><strong>Plan:</strong> ${activationCode.plan_type.charAt(0).toUpperCase() + activationCode.plan_type.slice(1)}</li>
          <li><strong>Vessels:</strong> ${plan.vessels}</li>
          <li><strong>Users:</strong> ${plan.users}</li>
          <li><strong>Valid Until:</strong> ${new Date(activationCode.expires_at).toLocaleDateString()}</li>
        </ul>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Go to the SMS Onboarding Portal</li>
          <li>Enter this activation code when prompted</li>
          <li>Complete your company registration</li>
          <li>Start adding vessels and users</li>
        </ol>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>The SMS Team</p>
      `
    });
  }

  /**
   * Check and update expired codes
   */
  async checkExpiredCodes(): Promise<void> {
    await dbRun(
      `UPDATE activation_codes 
       SET status = 'expired' 
       WHERE status = 'active' 
       AND expires_at < CURRENT_TIMESTAMP`
    );
  }

  /**
   * Get payment logs for monitoring
   */
  async getPaymentLogs(filters?: {
    processed?: boolean;
    startDate?: Date;
    endDate?: Date;
    email?: string;
  }): Promise<any[]> {
    let query = 'SELECT * FROM payment_logs WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.processed !== undefined) {
        query += ' AND processed = ?';
        params.push(filters.processed);
      }
      if (filters.startDate) {
        query += ' AND webhook_received_at >= ?';
        params.push(filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query += ' AND webhook_received_at <= ?';
        params.push(filters.endDate.toISOString());
      }
      if (filters.email) {
        query += ' AND customer_email = ?';
        params.push(filters.email);
      }
    }

    query += ' ORDER BY webhook_received_at DESC';

    return await dbAll(query, params);
  }
}

export const paymentService = new PaymentService();