/**
 * API Response Utility
 * Standardized API responses
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Response } from 'express';
import { HTTP_STATUS } from '@/constants/http-status.constant';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any[];
}

class ResponseHandler {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Request successful',
    statusCode: number = HTTP_STATUS.OK
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Request successful'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
    return res.status(HTTP_STATUS.OK).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send bad request response
   */
  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errors?: any[]
  ): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message: string = 'Resource conflict'
  ): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
}

export default ResponseHandler;
