/**
 * Upload Validation
 * Zod schemas for upload validation
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

// Upload category enum schema
const uploadCategorySchema = z.nativeEnum(EUPLOAD_CATEGORY);

// Single file upload validation
export const uploadFileValidation = z.object({
  category: uploadCategorySchema,
  relatedModel: z.enum(['Service', 'Category', 'Order']).optional(),
  relatedId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format').optional()
});

// Upload query validation
export const uploadQueryValidation = z.object({
  category: uploadCategorySchema.optional(),
  relatedModel: z.enum(['Service', 'Category', 'Order']).optional(),
  relatedId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

// Update relation validation
export const updateUploadRelationValidation = z.object({
  relatedModel: z.enum(['Service', 'Category', 'Order']),
  relatedId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format')
});

export type UploadFileInput = z.infer<typeof uploadFileValidation>;
export type UploadQueryInput = z.infer<typeof uploadQueryValidation>;
export type UpdateUploadRelationInput = z.infer<typeof updateUploadRelationValidation>;
