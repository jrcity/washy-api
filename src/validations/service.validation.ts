/**
 * Service Validation Schemas
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';
import { ESERVICE_CATEGORY, ESERVICE_TYPE, EGARMENT_TYPE } from '@/constants/enums.constant';

// Service pricing schema
const servicePricingSchema = z.object({
  garmentType: z.enum(Object.values(EGARMENT_TYPE) as [string, ...string[]]),
  basePrice: z.number().min(0, 'Price cannot be negative'),
  expressMultiplier: z.number().min(1).default(1.5)
});

// Create service validation
export const createServiceValidation = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(Object.values(ESERVICE_CATEGORY) as [string, ...string[]]).default('laundry'),
  serviceType: z.enum(Object.values(ESERVICE_TYPE) as [string, ...string[]]),
  pricing: z.array(servicePricingSchema).min(1, 'At least one pricing item is required'),
  estimatedDuration: z.object({
    standard: z.number().min(1).default(48),
    express: z.number().min(1).default(24)
  }).optional(),
  isExpressAvailable: z.boolean().default(true),
  branch: z.string().optional(),
  icon: z.string().url().optional(),
  sortOrder: z.number().default(0)
});

// Update service validation
export const updateServiceValidation = createServiceValidation.partial();

// Update pricing validation
export const updatePricingValidation = z.object({
  pricing: z.array(servicePricingSchema).min(1, 'At least one pricing item is required')
});

// Service query validation
export const serviceQueryValidation = z.object({
  category: z.enum(Object.values(ESERVICE_CATEGORY) as [string, ...string[]]).optional(),
  serviceType: z.enum(Object.values(ESERVICE_TYPE) as [string, ...string[]]).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  branch: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10)
});

// Calculate price validation
export const calculatePriceValidation = z.object({
  items: z.array(z.object({
    serviceId: z.string(),
    garmentType: z.enum(Object.values(EGARMENT_TYPE) as [string, ...string[]]),
    quantity: z.number().min(1),
    isExpress: z.boolean().default(false)
  })).min(1, 'At least one item is required')
});

export default {
  createServiceValidation,
  updateServiceValidation,
  updatePricingValidation,
  serviceQueryValidation,
  calculatePriceValidation
};
