/**
 * Task Validations
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { z } from 'zod';
import { ETASK_TYPE, ETASK_STATUS, ETASK_PRIORITY } from '@/constants/enums.constant';

export const createTaskValidation = z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
    type: z.nativeEnum(ETASK_TYPE),
    scheduledFor: z.string().datetime(),
    priority: z.nativeEnum(ETASK_PRIORITY).optional(),
    notes: z.string().max(500).optional(),
    address: z.object({
        street: z.string().min(1).max(200),
        area: z.string().min(1).max(100),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number()
        }).optional()
    })
});

export const assignTaskValidation = z.object({
    riderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid rider ID')
});

export const revokeTaskValidation = z.object({
    reason: z.string().min(1, 'Reason is required').max(500)
});

export const taskQueryValidation = z.object({
    branch: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    status: z.nativeEnum(ETASK_STATUS).optional(),
    type: z.nativeEnum(ETASK_TYPE).optional(),
    priority: z.nativeEnum(ETASK_PRIORITY).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
});

export default {
    createTaskValidation,
    assignTaskValidation,
    revokeTaskValidation,
    taskQueryValidation
};
