/**
 * Notification Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import NotificationService from '@/services/notification.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await NotificationService.getUserNotifications(req.user!._id.toString(), page, limit);
  return ResponseHandler.paginated(res, result.notifications,
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await NotificationService.getUnreadCount(req.user!._id.toString());
  return ResponseHandler.success(res, { unreadCount: count });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markAsRead(req.params.id!);
  return ResponseHandler.success(res, null, 'Marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markAllAsRead(req.user!._id.toString());
  return ResponseHandler.success(res, null, 'All notifications marked as read');
});

export default { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
