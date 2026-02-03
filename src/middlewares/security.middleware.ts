/**
 * Security Middleware
 * Rate limiting, NoSQL injection prevention, and audit logging
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { AppError } from '@/utils/error.util';

// ============== AUDIT LOGGING ==============

import AuditLog from '@/models/audit-log.model';
import { EAUDIT_ACTION } from '@/constants/enums.constant';

// ============== RATE LIMITING ==============

// Global rate limiter (100 requests per minute per IP)
const globalLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_global',
    points: 100,
    duration: 60
});

// Auth rate limiter (5 attempts per 15 minutes per IP)
const authLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_auth',
    points: 5,
    duration: 15 * 60,
    blockDuration: 15 * 60 // Block for 15 minutes after limit exceeded
});

// Sensitive operations limiter (10 per hour)
const sensitiveLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_sensitive',
    points: 10,
    duration: 60 * 60
});

/**
 * Global rate limiting middleware
 */
export const globalRateLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        await globalLimiter.consume(key);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            res.set({
                'Retry-After': Math.ceil(error.msBeforeNext / 1000),
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': String(error.remainingPoints),
                'X-RateLimit-Reset': new Date(Date.now() + error.msBeforeNext).toISOString()
            });
            return next(AppError.tooManyRequests('Too many requests, please try again later'));
        }
        next(error);
    }
};

/**
 * Auth rate limiting (for login/register endpoints)
 */
export const authRateLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        await authLimiter.consume(key);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            res.set({
                'Retry-After': Math.ceil(error.msBeforeNext / 1000)
            });
            return next(AppError.tooManyRequests('Too many login attempts, please try again later'));
        }
        next(error);
    }
};

/**
 * Sensitive operation rate limiting
 */
export const sensitiveRateLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = `${req.ip}_${req.user?._id || 'anon'}`;
        await sensitiveLimiter.consume(key);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            return next(AppError.tooManyRequests('Rate limit exceeded for this operation'));
        }
        next(error);
    }
};

/**
 * Reset rate limit for user (e.g., after successful CAPTCHA)
 */
export const resetAuthRateLimit = async (ip: string): Promise<void> => {
    try {
        await authLimiter.delete(ip);
    } catch (error) {
        console.error('Failed to reset rate limit:', error);
    }
};

// ============== NoSQL INJECTION PREVENTION ==============

/**
 * Sanitize request data to prevent NoSQL injection
 */
// ============== NoSQL INJECTION PREVENTION ==============

/**
 * Sanitize request data to prevent NoSQL injection
 * Replaces keys starting with $ (NoSQL operators)
 */

/**
 * Additional sanitization for specific patterns
 */
export const deepSanitize = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeValue = (value: any): any => {
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'string') {
            // Remove potential operators if they start with $
            if (value.startsWith('$')) {
                return '_' + value.substring(1);
            }
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        }
        if (value && typeof value === 'object') {
            const sanitized: any = {};
            for (const key of Object.keys(value)) {
                let newKey = key;
                // Replace keys starting with $
                if (key.startsWith('$')) {
                    newKey = '_' + key.substring(1);
                }
                sanitized[newKey] = sanitizeValue(value[key]);
            }
            return sanitized;
        }
        return value;
    };

    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        const sanitized = sanitizeValue(req.query);
        // Modify in place to avoid read-only property errors
        Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
        Object.assign(req.query, sanitized);
    }
    if (req.params) {
        const sanitized = sanitizeValue(req.params);
        // Modify in place to avoid read-only property errors
        Object.keys(req.params).forEach(key => delete (req.params as any)[key]);
        Object.assign(req.params, sanitized);
    }

    next();
};


interface AuditLogData {
    action: EAUDIT_ACTION;
    resource: string;
    resourceId?: string;
    userId?: string;
    details?: any;
    req: Request;
}

/**
 * Log an audit event
 */
export const logAudit = async (data: AuditLogData): Promise<void> => {
    try {
        await AuditLog.create({
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId,
            user: data.userId,
            ipAddress: data.req.ip || data.req.connection.remoteAddress,
            userAgent: data.req.get('User-Agent'),
            details: data.details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

/**
 * Audit middleware for sensitive endpoints
 */
export const auditMiddleware = (action: EAUDIT_ACTION, resource: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Log after response is sent
        res.on('finish', async () => {
            if (res.statusCode < 400) { // Only log successful operations
                await logAudit({
                    action,
                    resource,
                    resourceId: req.params.id as string,
                    userId: req.user?._id?.toString(),
                    details: {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode
                    },
                    req
                });
            }
        });
        next();
    };
};

// ============== PASSWORD VALIDATION ==============

/**
 * Validate password complexity
 */
export const validatePasswordComplexity = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Password complexity middleware
 */
export const checkPasswordComplexity = (req: Request, res: Response, next: NextFunction) => {
    const password = req.body.password || req.body.newPassword;

    if (!password) {
        return next();
    }

    const { valid, errors } = validatePasswordComplexity(password);

    if (!valid) {
        return next(AppError.badRequest(errors.join('. ')));
    }

    next();
};

// ============== SESSION SECURITY ==============

/**
 * Add security headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
    });
    next();
};

export default {
    globalRateLimit,
    authRateLimit,
    sensitiveRateLimit,
    resetAuthRateLimit,
    deepSanitize,
    logAudit,
    auditMiddleware,
    validatePasswordComplexity,
    checkPasswordComplexity,
    securityHeaders
};
