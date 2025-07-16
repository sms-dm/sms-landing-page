// Rate limiting middleware
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../../config';

// Create Redis client if Redis URL is available
let redisClient: Redis | null = null;
if (config.redis.url) {
  try {
    redisClient = new Redis(config.redis.url);
    console.log('Redis connected for rate limiting');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
}

// Base configuration
const baseConfig = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

// Create rate limiter with Redis store if available
const createLimiter = (options: any) => {
  const limiterConfig = {
    ...baseConfig,
    ...options,
  };

  // Use Redis store if available, otherwise use memory store
  if (redisClient) {
    limiterConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }

  return rateLimit(limiterConfig);
};

// Authentication rate limiters
export const loginRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: 'Too many login attempts from this IP, please try again later',
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req: Request) => {
    // Use combination of IP and email for more granular control
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  },
});

export const registrationRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: 'Too many registration attempts from this IP, please try again later',
});

export const passwordResetRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts from this IP, please try again later',
  keyGenerator: (req: Request) => {
    // Use combination of IP and email
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  },
});

export const apiRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 API requests per window
  message: 'Too many requests from this IP, please try again later',
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: 'Too many requests from this IP, please try again later',
});

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Get user role from request (set by auth middleware)
  const userRole = req.user?.role;

  // Define rate limits by role
  const limits: Record<string, number> = {
    SUPER_ADMIN: 1000,
    ADMIN: 500,
    MANAGER: 200,
    TECHNICIAN: 100,
    HSE_OFFICER: 100,
    default: 50,
  };

  const limit = limits[userRole || 'default'];

  const limiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: limit,
    keyGenerator: (req: Request) => req.user?.sub || req.ip,
  });

  return limiter(req, res, next);
};

// Cleanup Redis connection on shutdown
if (redisClient) {
  process.on('SIGTERM', () => {
    redisClient?.disconnect();
  });

  process.on('SIGINT', () => {
    redisClient?.disconnect();
  });
}