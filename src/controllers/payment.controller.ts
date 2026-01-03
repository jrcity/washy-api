/**
 * Payment Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import PaymentService from '@/services/payment.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { EPAYMENT_METHOD, EPAYMENT_STATUS } from '@/constants/enums.constant';

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.initializePayment(
    req.body.orderId, 
    req.user!._id.toString(), 
    req.body.method as EPAYMENT_METHOD, 
    req.body.callbackUrl
  );
  return ResponseHandler.created(res, payment, 'Payment initialized');
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.verifyPayment(req.params.reference!);
  return ResponseHandler.success(res, payment, 'Payment verified');
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.getPaymentById(req.params.id!);
  return ResponseHandler.success(res, payment);
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await PaymentService.getPayments({
    status: req.query.status as EPAYMENT_STATUS | undefined,
    method: req.query.method as EPAYMENT_METHOD | undefined,
    customer: req.query.customer as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10
  });
  return ResponseHandler.paginated(res, result.payments,
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const recordCashPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.recordCashPayment(
    req.body.orderId, req.body.customerId, req.body.amount
  );
  return ResponseHandler.created(res, payment, 'Cash payment recorded');
});

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { event, data } = req.body;
  if (event === 'charge.success' && data?.reference) {
    await PaymentService.verifyPayment(data.reference);
  }
  return res.sendStatus(200);
});

export default {
  initializePayment, verifyPayment, getPayment, getPayments, recordCashPayment, paystackWebhook
};
