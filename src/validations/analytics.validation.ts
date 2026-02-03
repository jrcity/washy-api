/**
 * Analytics Validations
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { z } from 'zod';
import { EANALYTICS_PERIOD } from '@/constants/enums.constant';

export const analyticsQueryValidation = z.object({
    period: z.nativeEnum(EANALYTICS_PERIOD).optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    metric: z.enum(['revenue', 'orders', 'rating']).optional(),
    riderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional()
});

export default { analyticsQueryValidation };
