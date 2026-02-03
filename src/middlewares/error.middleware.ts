/**
 * Error Handler Middleware
 * Global error handling for the application
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/error.util';
import { HTTP_STATUS } from '@/constants/http-status.constant';
import { CONFIGS } from '@/constants/configs.constant';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): AppError => {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return AppError.badRequest('Validation failed', errors);
};

/**
 * Handle MongoDB CastError (invalid ObjectId)
 */
const handleCastError = (error: mongoose.Error.CastError): AppError => {
  return AppError.badRequest(`Invalid ${error.path}: ${error.value}`);
};

/**
 * Handle MongoDB duplicate key error
 */
const handleDuplicateKeyError = (error: any): AppError => {
  const field = Object.keys(error.keyValue || {})[0] || 'field';
  const value = error.keyValue?.[field] || 'value';
  return AppError.conflict(`${field} '${value}' already exists`);
};

/**
 * Handle MongoDB validation error
 */
const handleValidationError = (error: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message
  }));

  return AppError.badRequest('Validation failed', errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => {
  return AppError.unauthorized('Invalid token. Please log in again.');
};

const handleJWTExpiredError = (): AppError => {
  return AppError.unauthorized('Your token has expired. Please log in again.');
};

/**
 * Send error response for development
 */
const sendErrorDev = (error: AppError, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    message: error.message,
    errors: error.errors,
    stack: error.stack
  };

  res.status(error.statusCode).json(response);
};

/**
 * Send error response for production
 */
const sendErrorProd = (error: AppError, res: Response): void => {
  if (error.isOperational) {
    const response: ErrorResponse = {
      success: false,
      message: error.message,
      errors: error.errors
    };

    res.status(error.statusCode).json(response);
  } else {
    console.error('ERROR 💥', error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  error.statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  error.status = error.status || 'error';

  let processedError = error;

  if (error instanceof ZodError) {
    processedError = handleZodError(error);
  } else if (error.name === 'CastError') {
    processedError = handleCastError(error);
  } else if (error.code === 11000) {
    processedError = handleDuplicateKeyError(error);
  } else if (error.name === 'ValidationError') {
    processedError = handleValidationError(error);
  } else if (error.name === 'JsonWebTokenError') {
    processedError = handleJWTError();
  } else if (error.name === 'TokenExpiredError') {
    processedError = handleJWTExpiredError();
  } else if (!(error instanceof AppError)) {
    processedError = new AppError(
      error.message || 'An unexpected error occurred',
      error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  if (CONFIGS.APP.ENV === 'development') {
    sendErrorDev(processedError, res);
  } else {
    sendErrorProd(processedError, res);
  }
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl}`));
};

export default {
  errorHandler,
  notFoundHandler
};
