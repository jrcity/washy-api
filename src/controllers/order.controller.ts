/**
 * Order Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import OrderService from '@/services/order.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { EORDER_STATUS } from '@/constants/enums.constant';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.createOrder({
    ...req.body,
    customer: req.user!._id.toString()
  });
  return ResponseHandler.created(res, order, 'Order created successfully');
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.getOrderById(req.params.id!);
  return ResponseHandler.success(res, order);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.getOrders({
    status: req.query.status as EORDER_STATUS | undefined,
    branch: req.query.branch as string,
    customer: req.query.customer as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sort: (req.query.sort as string) || '-createdAt'
  });
  return ResponseHandler.paginated(res, result.orders, 
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.getOrders({
    customer: req.user!._id.toString(),
    status: req.query.status as EORDER_STATUS | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10
  });
  return ResponseHandler.paginated(res, result.orders,
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.updateOrderStatus(req.params.id!, {
    ...req.body,
    updatedBy: req.user!._id.toString()
  });
  return ResponseHandler.success(res, order, 'Order status updated');
});

export const assignRider = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.assignRider(req.params.id!, req.body.riderId, req.body.type);
  return ResponseHandler.success(res, order, 'Rider assigned successfully');
});

export const verifyDelivery = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.verifyDelivery(req.params.id!, req.body);
  return ResponseHandler.success(res, order, 'Delivery verified');
});

export const generateDeliveryOtp = asyncHandler(async (req: Request, res: Response) => {
  const otp = await OrderService.generateDeliveryOtp(req.params.id!);
  return ResponseHandler.success(res, { otp }, 'OTP generated');
});

export const rateOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.rateOrder(req.params.id!, req.body.rating, req.body.feedback);
  return ResponseHandler.success(res, order, 'Rating submitted');
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.cancelOrder(req.params.id!, req.body.reason, req.user!._id.toString());
  return ResponseHandler.success(res, order, 'Order cancelled');
});

export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.query.branch as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  
  const stats = await OrderService.getOrderStats(branchId, startDate, endDate);
  return ResponseHandler.success(res, stats);
});

export default {
  createOrder, getOrder, getOrders, getMyOrders, updateOrderStatus,
  assignRider, verifyDelivery, generateDeliveryOtp, rateOrder, cancelOrder, getOrderStats
};
