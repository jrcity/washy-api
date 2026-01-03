/**
 * AppError Utility
 * Custom error class for application errors
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { HTTP_STATUS } from '@/constants/http-status.constant';

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors?: any[];

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any[]): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message: string = 'Resource conflict'): AppError {
    return new AppError(message, HTTP_STATUS.CONFLICT);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default AppError;
