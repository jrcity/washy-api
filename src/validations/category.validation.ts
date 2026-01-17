/**
 * Category Validation
 * Zod schemas for category validation
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';

// Create category validation
export const createCategoryValidation = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  sortOrder: z.number().int().min(0).optional()
});

// Update category validation
export const updateCategoryValidation = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

// Category query validation
export const categoryQueryValidation = z.object({
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateCategoryInput = z.infer<typeof createCategoryValidation>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryValidation>;
export type CategoryQueryInput = z.infer<typeof categoryQueryValidation>;
