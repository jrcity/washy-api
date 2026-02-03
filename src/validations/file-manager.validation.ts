/**
 * FileManager Validations
 * Zod schemas for file management endpoints
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { z } from 'zod';
import { EFILE_FOLDER } from '@/constants/enums.constant';

// Upload file validation
export const uploadFileValidation = z.object({
    folder: z.nativeEnum(EFILE_FOLDER).default(EFILE_FOLDER.OTHER),
    tags: z.string().optional(),
    relatedModel: z.enum(['Service', 'Category', 'Order', 'Branch', 'Receipt', 'User']).optional(),
    relatedId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    description: z.string().max(500).optional(),
    metadata: z.string().optional() // JSON string
});

// File query validation
export const fileQueryValidation = z.object({
    folder: z.nativeEnum(EFILE_FOLDER).optional(),
    uploadedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    relatedModel: z.enum(['Service', 'Category', 'Order', 'Branch', 'Receipt', 'User']).optional(),
    relatedId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    tags: z.string().optional(), // Comma-separated
    mimeType: z.string().optional(),
    isArchived: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional()
});

// Update tags validation
export const updateTagsValidation = z.object({
    tags: z.array(z.string().min(1).max(50)).max(20)
});

// Move to folder validation
export const moveFolderValidation = z.object({
    folder: z.nativeEnum(EFILE_FOLDER)
});

// Bulk archive validation
export const bulkArchiveValidation = z.object({
    fileIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')).min(1).max(100)
});

// Update relation validation
export const updateRelationValidation = z.object({
    relatedModel: z.enum(['Service', 'Category', 'Order', 'Branch', 'Receipt', 'User']),
    relatedId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')
});

export default {
    uploadFileValidation,
    fileQueryValidation,
    updateTagsValidation,
    moveFolderValidation,
    bulkArchiveValidation,
    updateRelationValidation
};
