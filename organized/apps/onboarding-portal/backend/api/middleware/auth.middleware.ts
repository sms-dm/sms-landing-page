// Authentication and authorization middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UserRole, JWTPayload } from '../../types/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Authentication middleware - verifies JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'No valid authentication token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret!) as JWTPayload;
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        res.status(401).json({
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        });
        return;
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication error occurred',
    });
  }
};

// Authorization middleware - checks user roles
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
        details: {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        },
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret!) as JWTPayload;
    
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      next();
      return;
    }
    
    req.user = decoded;
  } catch (error) {
    // Invalid token is ignored for optional auth
  }
  
  next();
};