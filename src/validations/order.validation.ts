/**
 * Order Validation Schemas
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';
import { EORDER_STATUS, ESERVICE_TYPE, EGARMENT_TYPE, EDELIVERY_PROOF_TYPE } from '@/constants/enums.constant';

// Address schema
const addressSchema = z.object({
  street: z.string().min(3, 'Street is required'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().default('Lagos'),
  landmark: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

// Order item schema
const orderItemSchema = z.object({
  service: z.string().min(1, 'Service ID is required'),
  serviceType: z.enum(Object.values(ESERVICE_TYPE) as [string, ...string[]]),
  garmentType: z.enum(Object.values(EGARMENT_TYPE) as [string, ...string[]]),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
  isExpress: z.boolean().default(false)
});

// Create order validation
export const createOrderValidation = z.object({
  branch: z.string().min(1, 'Branch ID is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  pickupDate: z.string().datetime().or(z.date()),
  pickupTimeSlot: z.string().min(1, 'Pickup time slot is required'),
  expectedDeliveryDate: z.string().datetime().or(z.date()).optional(),
  deliveryTimeSlot: z.string().optional(),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema.optional(),
  customerNotes: z.string().optional(),
  discountCode: z.string().optional()
});

// Update order status validation
export const updateOrderStatusValidation = z.object({
  status: z.enum(Object.values(EORDER_STATUS) as [string, ...string[]]),
  notes: z.string().optional()
});

// Assign rider validation
export const assignRiderValidation = z.object({
  riderId: z.string().min(1, 'Rider ID is required'),
  type: z.enum(['pickup', 'delivery'])
});

// Delivery proof validation
export const deliveryProofValidation = z.object({
  type: z.enum(Object.values(EDELIVERY_PROOF_TYPE) as [string, ...string[]]),
  photoUrl: z.string().url().optional(),
  otpCode: z.string().length(4).optional(),
  signature: z.string().optional()
});

// Order rating validation
export const orderRatingValidation = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional()
});

// Order query params validation
export const orderQueryValidation = z.object({
  status: z.enum(Object.values(EORDER_STATUS) as [string, ...string[]]).optional(),
  branch: z.string().optional(),
  customer: z.string().optional(),
  rider: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sort: z.string().default('-createdAt')
});

// Cancel order validation
export const cancelOrderValidation = z.object({
  reason: z.string().min(5, 'Cancellation reason is required')
});

export default {
  createOrderValidation,
  updateOrderStatusValidation,
  assignRiderValidation,
  deliveryProofValidation,
  orderRatingValidation,
  orderQueryValidation,
  cancelOrderValidation
};
