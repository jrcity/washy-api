/**
 * HttpStatusConstant
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;



export const HTTP_VERBOSE_MESSAGES = {
    OK: 'Request was successful',
    CREATED: 'Resource was created successfully',
    NO_CONTENT: 'No content to return',
    BAD_REQUEST: 'Invalid request',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource conflict',
    INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;