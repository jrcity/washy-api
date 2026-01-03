/**
 * Authentication Middleware
 * JWT authentication and authorization
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response, NextFunction } from 'express';
import { tokenService, DecodedToken } from '@/utils/token.util';
import { AppError } from '@/utils/error.util';
import User, { IUser } from '@/models/user.model';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: DecodedToken;
    }
  }
}

/**
 * Authenticate user via JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw AppError.unauthorized('No token provided');
    }
    
    // Verify token
    const decoded = tokenService.verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      throw AppError.unauthorized('User not found');
    }
    
    // Attach user and token to request
    req.user = user;
    req.token = decoded;
    
    next();
  } catch (error: any) {
    next(AppError.unauthorized(error.message || 'Authentication failed'));
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = tokenService.verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (user) {
          req.user = user;
          req.token = decoded;
        }
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles: EUSERS_ROLE[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Role '${req.user.role}' is not authorized for this action`)
      );
    }
    
    next();
  };
};

/**
 * Check for specific permissions
 */
export const requirePermission = (...permissions: EPERMISSIONS[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated'));
    }
    
    // Super admins and admins have all permissions
    if (
      req.user.role === EUSERS_ROLE.SUPER_ADMIN ||
      req.user.role === EUSERS_ROLE.ADMIN
    ) {
      return next();
    }
    
    // For other roles, check specific permissions
    const userPermissions = (req.user as any).permissions || [];
    
    const hasPermission = permissions.every(
      (permission) => userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return next(
        AppError.forbidden('You do not have permission for this action')
      );
    }
    
    next();
  };
};

/**
 * Restrict access to resource owner or admin
 */
export const restrictToOwnerOrAdmin = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated'));
    }
    
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const isOwner = req.user._id.toString() === resourceUserId;
    const isAdmin =
      req.user.role === EUSERS_ROLE.ADMIN ||
      req.user.role === EUSERS_ROLE.SUPER_ADMIN;
    
    if (!isOwner && !isAdmin) {
      return next(AppError.forbidden('Not authorized to access this resource'));
    }
    
    next();
  };
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  requirePermission,
  restrictToOwnerOrAdmin
};
