/**
 * Chat Validations
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { z } from 'zod';
import { EMESSAGE_TYPE } from '@/constants/enums.constant';

export const startSupportChatValidation = z.object({
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID')
});

export const startRiderChatValidation = z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID')
});

export const sendMessageValidation = z.object({
    content: z.string().min(1).max(2000),
    type: z.nativeEnum(EMESSAGE_TYPE).optional(),
    attachments: z.array(z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        type: z.string(),
        name: z.string(),
        size: z.number()
    })).max(5).optional(),
    replyTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID').optional()
});

export default {
    startSupportChatValidation,
    startRiderChatValidation,
    sendMessageValidation
};
