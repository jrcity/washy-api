/**
 * Validation Middleware
 * Request validation using Zod schemas
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/utils/error.util';

/**
 * Validate request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(AppError.badRequest('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(AppError.badRequest('Invalid query parameters', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(AppError.badRequest('Invalid URL parameters', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate entire request (body, query, params)
 */
export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsed = await schema.query.parseAsync(req.query);
        req.query = parsed as any;
      }
      if (schema.params) {
        const parsed = await schema.params.parseAsync(req.params);
        req.params = parsed as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(AppError.badRequest('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
};
