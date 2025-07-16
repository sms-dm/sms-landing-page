import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import crypto from 'crypto';

// Webhook verification for different payment providers
const verifyWebhookSignature = (provider: string, request: Request): boolean => {
  switch (provider) {
    case 'stripe':
      // Stripe webhook verification
      const stripeSignature = request.headers['stripe-signature'] as string;
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!stripeSignature || !stripeWebhookSecret) {
        return false;
      }

      try {
        // In production, use Stripe SDK to verify
        // const event = stripe.webhooks.constructEvent(request.body, stripeSignature, stripeWebhookSecret);
        // For now, we'll do basic validation
        return true;
      } catch (err) {
        return false;
      }

    case 'paypal':
      // PayPal webhook verification
      // Implement PayPal-specific verification
      return true;

    default:
      return false;
  }
};

// Extract plan details from webhook payload
const extractPlanDetails = (provider: string, payload: any): {
  company_name: string;
  plan_type: 'starter' | 'pro' | 'enterprise';
  email: string;
} => {
  switch (provider) {
    case 'stripe':
      // Extract from Stripe metadata
      return {
        company_name: payload.metadata?.company_name || 'Unknown Company',
        plan_type: payload.metadata?.plan_type || 'starter',
        email: payload.receipt_email || payload.customer_email || ''
      };

    case 'paypal':
      // Extract from PayPal custom fields
      return {
        company_name: payload.purchase_units?.[0]?.custom?.company_name || 'Unknown Company',
        plan_type: payload.purchase_units?.[0]?.custom?.plan_type || 'starter',
        email: payload.payer?.email_address || ''
      };

    default:
      throw new Error('Unknown payment provider');
  }
};

export const paymentController = {
  /**
   * Handle payment webhook from payment providers
   */
  async handlePaymentWebhook(req: Request, res: Response) {
    try {
      const provider = req.params.provider?.toLowerCase();
      
      if (!provider || !['stripe', 'paypal'].includes(provider)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment provider'
        });
      }

      // Verify webhook signature
      if (!verifyWebhookSignature(provider, req)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      const payload = req.body;
      let paymentStatus: string;
      let paymentId: string;
      let amount: number;
      let currency: string;
      let customerEmail: string;
      let customerName: string | undefined;
      let eventType: string;

      // Extract payment details based on provider
      switch (provider) {
        case 'stripe':
          eventType = payload.type;
          const stripeData = payload.data.object;
          
          // Only process successful payments
          if (eventType !== 'payment_intent.succeeded' && eventType !== 'checkout.session.completed') {
            return res.status(200).json({ received: true });
          }

          paymentStatus = stripeData.status === 'paid' || stripeData.payment_status === 'paid' ? 'succeeded' : stripeData.status;
          paymentId = stripeData.id;
          amount = stripeData.amount / 100; // Convert from cents
          currency = stripeData.currency?.toUpperCase() || 'USD';
          customerEmail = stripeData.receipt_email || stripeData.customer_details?.email || '';
          customerName = stripeData.customer_details?.name;
          break;

        case 'paypal':
          eventType = payload.event_type;
          
          // Only process completed payments
          if (eventType !== 'PAYMENT.CAPTURE.COMPLETED' && eventType !== 'CHECKOUT.ORDER.APPROVED') {
            return res.status(200).json({ received: true });
          }

          const paypalData = payload.resource;
          paymentStatus = paypalData.status === 'COMPLETED' ? 'succeeded' : paypalData.status;
          paymentId = paypalData.id;
          amount = parseFloat(paypalData.amount?.value || '0');
          currency = paypalData.amount?.currency_code || 'USD';
          customerEmail = payload.payer?.email_address || '';
          customerName = `${payload.payer?.name?.given_name || ''} ${payload.payer?.name?.surname || ''}`.trim();
          break;

        default:
          throw new Error('Unsupported payment provider');
      }

      // Extract plan details from the payload
      const planDetails = extractPlanDetails(provider, payload);

      // Process the payment webhook
      await paymentService.processPaymentWebhook({
        provider,
        payment_id: paymentId,
        payment_status: paymentStatus,
        amount,
        currency,
        customer_email: customerEmail || planDetails.email,
        customer_name: customerName,
        company_name: planDetails.company_name,
        plan_type: planDetails.plan_type,
        webhook_event_type: eventType,
        webhook_payload: payload
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Payment webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  },

  /**
   * Validate an activation code
   */
  async validateActivationCode(req: Request, res: Response) {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Activation code is required'
        });
      }

      // Get client IP address
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Validate the code
      const validation = await paymentService.validateActivationCode(code, ipAddress);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          valid: false
        });
      }

      res.json({
        success: true,
        valid: true,
        company: validation.company,
        expires_at: validation.code?.expires_at,
        remaining_uses: (validation.code?.max_uses || 1) - (validation.code?.current_uses || 0)
      });
    } catch (error) {
      console.error('Code validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate activation code'
      });
    }
  },

  /**
   * Get activation code status
   */
  async getActivationCodeStatus(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Activation code is required'
        });
      }

      const activationCode = await paymentService.getActivationCodeStatus(code);

      if (!activationCode) {
        return res.status(404).json({
          success: false,
          error: 'Activation code not found'
        });
      }

      // Don't expose sensitive payment information
      const { 
        payment_reference, 
        payment_amount,
        webhook_payload,
        ...safeCode 
      } = activationCode;

      res.json({
        success: true,
        code: safeCode
      });
    } catch (error) {
      console.error('Get code status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get activation code status'
      });
    }
  },

  /**
   * Use an activation code (for onboarding portal)
   */
  async useActivationCode(req: Request, res: Response) {
    try {
      const { code, company_id, user_id } = req.body;

      if (!code || !company_id || !user_id) {
        return res.status(400).json({
          success: false,
          error: 'Code, company_id, and user_id are required'
        });
      }

      // Get client IP and user agent
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Use the activation code
      const success = await paymentService.useActivationCode(
        code,
        company_id,
        user_id,
        ipAddress,
        userAgent
      );

      res.json({
        success,
        message: 'Activation code used successfully'
      });
    } catch (error: any) {
      console.error('Use activation code error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to use activation code'
      });
    }
  },

  /**
   * Admin endpoint to create activation codes manually
   */
  async createActivationCode(req: Request, res: Response) {
    try {
      // This should be protected by admin authentication
      const {
        company_name,
        plan_type,
        email,
        expires_in_days,
        max_uses
      } = req.body;

      if (!company_name || !plan_type || !email) {
        return res.status(400).json({
          success: false,
          error: 'Company name, plan type, and email are required'
        });
      }

      const activationCode = await paymentService.createActivationCode({
        company_name,
        plan_type,
        email,
        expires_in_days,
        max_uses,
        metadata: {
          created_by: 'admin',
          created_at: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        code: activationCode.code,
        expires_at: activationCode.expires_at
      });
    } catch (error) {
      console.error('Create activation code error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create activation code'
      });
    }
  },

  /**
   * Admin endpoint to get payment logs
   */
  async getPaymentLogs(req: Request, res: Response) {
    try {
      // This should be protected by admin authentication
      const { processed, start_date, end_date, email } = req.query;

      const filters: any = {};
      if (processed !== undefined) {
        filters.processed = processed === 'true';
      }
      if (start_date) {
        filters.startDate = new Date(start_date as string);
      }
      if (end_date) {
        filters.endDate = new Date(end_date as string);
      }
      if (email) {
        filters.email = email as string;
      }

      const logs = await paymentService.getPaymentLogs(filters);

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get payment logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment logs'
      });
    }
  }
};