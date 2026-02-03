/**
 * RBAC Validations
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { z } from 'zod';
import { EUSERS_ROLE, ERBAC_ACTION, ERBAC_OPERATOR } from '@/constants/enums.constant';

const conditionSchema = z.object({
    field: z.string().min(1),
    operator: z.nativeEnum(ERBAC_OPERATOR),
    value: z.any(),
    valueField: z.string().optional()
});

export const createPolicyValidation = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    resource: z.enum(['Order', 'Branch', 'Customer', 'Service', 'Payment', 'Rider', 'Staff', 'Task', 'Upload']),
    action: z.nativeEnum(ERBAC_ACTION),
    roles: z.array(z.nativeEnum(EUSERS_ROLE)).min(1),
    conditions: z.array(conditionSchema).default([]),
    conditionLogic: z.enum(['AND', 'OR']).optional(),
    priority: z.number().min(0).max(100).optional()
});

export const updatePolicyValidation = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    resource: z.enum(['Order', 'Branch', 'Customer', 'Service', 'Payment', 'Rider', 'Staff', 'Task', 'Upload']).optional(),
    action: z.nativeEnum(ERBAC_ACTION).optional(),
    roles: z.array(z.nativeEnum(EUSERS_ROLE)).min(1).optional(),
    conditions: z.array(conditionSchema).optional(),
    conditionLogic: z.enum(['AND', 'OR']).optional(),
    priority: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional()
});

export const policyQueryValidation = z.object({
    resource: z.enum(['Order', 'Branch', 'Customer', 'Service', 'Payment', 'Rider', 'Staff', 'Task', 'Upload']).optional(),
    action: z.nativeEnum(ERBAC_ACTION).optional(),
    isActive: z.enum(['true', 'false']).optional()
});

export default {
    createPolicyValidation,
    updatePolicyValidation,
    policyQueryValidation
};
