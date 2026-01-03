/**
 * Async Handler Utility
 * Wrapper for async controller functions
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async controller functions to handle errors automatically
 * Eliminates the need for try-catch blocks in every controller
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
