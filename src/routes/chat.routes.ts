/**
 * Chat Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import ChatController from '@/controllers/chat.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validateBody } from '@/middlewares/validation.middleware';
import { startSupportChatValidation, startRiderChatValidation, sendMessageValidation } from '@/validations/chat.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Get unread count
router.get('/unread-count', ChatController.getUnreadCount);

// Get user's conversations
router.get('/conversations', ChatController.getConversations);

// Start support chat (customer only)
router.post('/support/start',
    authorize(EUSERS_ROLE.CUSTOMER),
    validateBody(startSupportChatValidation),
    ChatController.startSupportChat
);

// Start rider-customer chat (rider only, requires order payment)
router.post('/rider/start',
    authorize(EUSERS_ROLE.RIDER),
    validateBody(startRiderChatValidation),
    ChatController.startRiderChat
);

// Get conversation by ID
router.get('/conversations/:id', ChatController.getConversation);

// Get conversation messages
router.get('/conversations/:id/messages', ChatController.getMessages);

// Send message
router.post('/conversations/:id/messages',
    validateBody(sendMessageValidation),
    ChatController.sendMessage
);

// Delete message
router.delete('/conversations/:id/messages/:messageId', ChatController.deleteMessage);

// Close conversation (staff/manager)
router.patch('/conversations/:id/close',
    authorize(EUSERS_ROLE.STAFF, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN),
    ChatController.closeConversation
);

// Reopen conversation
router.patch('/conversations/:id/reopen',
    authorize(EUSERS_ROLE.STAFF, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN),
    ChatController.reopenConversation
);

export default router;
