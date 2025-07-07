import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import Redis from 'ioredis';

// In-memory store for development, Redis for production
const rateLimiterStore = process.env.REDIS_URL 
  ? new RateLimiterRedis({
      storeClient: new Redis(process.env.REDIS_URL),
      keyPrefix: 'ratelimit',
    })
  : new RateLimiterMemory();

// Different rate limiters for different endpoints
export const rateLimiters = {
  // Activation code validation: 5 attempts per hour per IP
  activationValidation: new RateLimiterMemory({
    keyPrefix: 'activation_validation',
    points: 5,
    duration: 3600, // 1 hour
    blockDuration: 3600, // Block for 1 hour after limit reached
  }),

  // Activation code usage: 3 attempts per hour per IP
  activationUsage: new RateLimiterMemory({
    keyPrefix: 'activation_usage',
    points: 3,
    duration: 3600,
    blockDuration: 7200, // Block for 2 hours after limit reached
  }),

  // Help request: 5 attempts per hour per IP
  helpRequest: new RateLimiterMemory({
    keyPrefix: 'help_request',
    points: 5,
    duration: 3600,
    blockDuration: 3600,
  }),

  // Code regeneration: 3 attempts per day per email
  codeRegeneration: new RateLimiterMemory({
    keyPrefix: 'code_regeneration',
    points: 3,
    duration: 86400, // 24 hours
    blockDuration: 86400,
  }),

  // Login attempts: 10 per hour per IP
  login: new RateLimiterMemory({
    keyPrefix: 'login',
    points: 10,
    duration: 3600,
    blockDuration: 1800, // Block for 30 minutes
  }),

  // General API: 100 requests per minute per IP
  general: new RateLimiterMemory({
    keyPrefix: 'general',
    points: 100,
    duration: 60,
  }),
};

// Helper to get client identifier (IP + User-Agent for better fingerprinting)
export function getClientIdentifier(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const forwardedFor = req.headers['x-forwarded-for'];
  
  // Use forwarded IP if behind proxy
  const clientIp = forwardedFor 
    ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0])
    : ip;
    
  return `${clientIp}:${userAgent}`;
}

// Middleware factory
export function createRateLimiter(limiterName: keyof typeof rateLimiters, useEmail = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limiter = rateLimiters[limiterName];
      
      // Use email as key for certain endpoints (like regeneration)
      const key = useEmail && req.body.email 
        ? req.body.email.toLowerCase() 
        : getClientIdentifier(req);

      try {
        await limiter.consume(key);
        
        // Add rate limit headers
        const rateLimiterRes = await limiter.get(key);
        if (rateLimiterRes) {
          res.setHeader('X-RateLimit-Limit', limiter.points);
          res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
          res.setHeader('X-RateLimit-Reset', rateLimiterRes.msBeforeNext ? 
            new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString() : 
            new Date().toISOString()
          );
        }
        
        next();
      } catch (rateLimiterRes: any) {
        // Rate limit exceeded
        const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;
        res.setHeader('Retry-After', secs);
        res.setHeader('X-RateLimit-Limit', limiter.points);
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints || 0);
        res.setHeader('X-RateLimit-Reset', 
          new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
        );
        
        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
          retryAfter: secs
        });
      }
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block requests if rate limiter fails
      next();
    }
  };
}

// Specific middleware exports
export const activationValidationRateLimit = createRateLimiter('activationValidation');
export const activationUsageRateLimit = createRateLimiter('activationUsage');
export const helpRequestRateLimit = createRateLimiter('helpRequest');
export const codeRegenerationRateLimit = createRateLimiter('codeRegeneration', true);
export const loginRateLimit = createRateLimiter('login');
export const generalRateLimit = createRateLimiter('general');

// Function to reset rate limit for a specific key (useful for testing or admin override)
export async function resetRateLimit(limiterName: keyof typeof rateLimiters, key: string): Promise<boolean> {
  try {
    const limiter = rateLimiters[limiterName];
    await limiter.delete(key);
    return true;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}

// Function to get current rate limit status
export async function getRateLimitStatus(limiterName: keyof typeof rateLimiters, key: string) {
  try {
    const limiter = rateLimiters[limiterName];
    const res = await limiter.get(key);
    
    if (!res) {
      return {
        consumedPoints: 0,
        remainingPoints: limiter.points,
        msBeforeNext: 0,
        isBlocked: false
      };
    }
    
    return {
      consumedPoints: res.consumedPoints,
      remainingPoints: res.remainingPoints,
      msBeforeNext: res.msBeforeNext,
      isBlocked: res.consumedPoints >= limiter.points
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}