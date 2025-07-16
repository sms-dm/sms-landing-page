import { AuthRequest } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request extends AuthRequest {}
  }
}