// Webhook signature validation middleware
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../../config';

// Extend Express Request type to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// Middleware to capture raw body for webhook signature validation
export const captureRawBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = Buffer.from(data);
      next();
    });
  } else {
    next();
  }
};

// Validate webhook signature
export const validateWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-webhook-signature'] as string;
  
  if (!signature) {
    return res.status(401).json({
      code: 'MISSING_SIGNATURE',
      message: 'Webhook signature is required',
    });
  }

  if (!config.integration.webhookSecret) {
    return res.status(500).json({
      code: 'WEBHOOK_CONFIG_ERROR',
      message: 'Webhook secret not configured',
    });
  }

  try {
    // Get the raw body
    const payload = req.rawBody || JSON.stringify(req.body);
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', config.integration.webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!signatureValid) {
      return res.status(401).json({
        code: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      code: 'SIGNATURE_VERIFICATION_FAILED',
      message: 'Failed to verify webhook signature',
    });
  }
};

// Webhook timestamp validation to prevent replay attacks
export const validateWebhookTimestamp = (maxAgeSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timestampHeader = req.headers['x-webhook-timestamp'] as string;
    
    if (!timestampHeader) {
      return res.status(400).json({
        code: 'MISSING_TIMESTAMP',
        message: 'Webhook timestamp is required',
      });
    }

    try {
      const timestamp = parseInt(timestampHeader, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (isNaN(timestamp)) {
        return res.status(400).json({
          code: 'INVALID_TIMESTAMP',
          message: 'Invalid timestamp format',
        });
      }

      const age = currentTime - timestamp;
      
      if (age > maxAgeSeconds) {
        return res.status(400).json({
          code: 'WEBHOOK_TOO_OLD',
          message: `Webhook timestamp is too old (${age} seconds)`,
        });
      }

      if (age < -maxAgeSeconds) {
        return res.status(400).json({
          code: 'WEBHOOK_TIMESTAMP_FUTURE',
          message: 'Webhook timestamp is in the future',
        });
      }

      next();
    } catch (error) {
      return res.status(400).json({
        code: 'TIMESTAMP_VALIDATION_FAILED',
        message: 'Failed to validate webhook timestamp',
      });
    }
  };
};