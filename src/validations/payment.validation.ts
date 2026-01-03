/**
 * Payment Validation Schemas
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';
import { EPAYMENT_METHOD, EPAYMENT_STATUS } from '@/constants/enums.constant';

// Initialize payment validation
export const initializePaymentValidation = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  method: z.enum(Object.values(EPAYMENT_METHOD) as [string, ...string[]]),
  callbackUrl: z.string().url().optional()
});

// Verify payment validation
export const verifyPaymentValidation = z.object({
  reference: z.string().min(1, 'Payment reference is required')
});

// Bank transfer details validation
export const bankTransferValidation = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(10, 'Invalid account number'),
  accountName: z.string().min(1, 'Account name is required'),
  transferReference: z.string().optional()
});

// Refund validation
export const refundValidation = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().min(1, 'Refund amount is required'),
  reason: z.string().min(5, 'Refund reason is required')
});

// Payment query validation
export const paymentQueryValidation = z.object({
  status: z.enum(Object.values(EPAYMENT_STATUS) as [string, ...string[]]).optional(),
  method: z.enum(Object.values(EPAYMENT_METHOD) as [string, ...string[]]).optional(),
  customer: z.string().optional(),
  order: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10)
});

export default {
  initializePaymentValidation,
  verifyPaymentValidation,
  bankTransferValidation,
  refundValidation,
  paymentQueryValidation
};
