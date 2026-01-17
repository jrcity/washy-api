/**
 * Middleware Exports
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

export {
  authenticate,
  optionalAuth,
  authorize,
  requirePermission,
  restrictToOwnerOrAdmin
} from './auth.middleware';

export {
  errorHandler,
  notFoundHandler
} from './error.middleware';

export {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
} from './validation.middleware';

export {
  uploadSingle,
  uploadMultiple,
  uploadFields
} from './upload.middleware';
