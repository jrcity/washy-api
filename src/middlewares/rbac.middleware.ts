/**
 * RBAC Middleware
 * Request-level access control checks
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import rbacService from '@/services/rbac.service';
import { AppError } from '@/utils/error.util';
import { ERBAC_ACTION, EUSERS_ROLE } from '@/constants/enums.constant';

/**
 * Check if user has access to perform action on resource
 */
export const checkResourceAccess = (resource: string, action: ERBAC_ACTION) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(AppError.unauthorized('Not authenticated'));
            }

            // Super admin bypasses all checks
            if (req.user.role === EUSERS_ROLE.SUPER_ADMIN) {
                return next();
            }

            const context = {
                user: {
                    _id: req.user._id.toString(),
                    role: req.user.role,
                    branch: req.user.branch?.toString()
                },
                resource: req.body,
                request: {
                    params: req.params,
                    query: req.query
                }
            };

            const { allowed } = await rbacService.checkAccess(resource, action, context);

            if (!allowed) {
                return next(AppError.forbidden('You do not have permission to perform this action'));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Apply access filter to query based on user's role and policies
 */
export const applyAccessFilter = (resource: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(AppError.unauthorized('Not authenticated'));
            }

            const context = {
                user: {
                    _id: req.user._id.toString(),
                    role: req.user.role,
                    branch: req.user.branch?.toString()
                }
            };

            const accessFilter = await rbacService.getAccessFilter(resource, context);

            // Attach filter to request for use in controller/service
            (req as any).accessFilter = accessFilter;

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check ownership or admin access
 */
export const checkOwnershipOrAdmin = (ownerField: string = 'customer') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(AppError.unauthorized('Not authenticated'));
            }

            // Admin roles always pass
            if ([EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.ADMIN, EUSERS_ROLE.BRANCH_MANAGER].includes(req.user.role)) {
                return next();
            }

            // For specific resource, check if user owns it
            const resourceId = req.params.id;
            if (resourceId && req.body && req.body[ownerField]) {
                if (req.body[ownerField].toString() !== req.user._id.toString()) {
                    return next(AppError.forbidden('You can only access your own resources'));
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default {
    checkResourceAccess,
    applyAccessFilter,
    checkOwnershipOrAdmin
};
