/**
 * Chat Controller
 * HTTP handlers for chat operations
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import chatService from '@/services/chat.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';

class ChatController {
    /**
     * Start/get support conversation
     */
    startSupportChat = asyncHandler(async (req: Request, res: Response) => {
        const conversation = await chatService.getOrCreateSupportConversation(
            req.user!._id.toString(),
            req.body.branchId
        );
        return ResponseHandler.success(res, conversation, 'Support chat started');
    });

    /**
     * Start/get rider-customer conversation
     */
    startRiderChat = asyncHandler(async (req: Request, res: Response) => {
        const conversation = await chatService.getOrCreateRiderCustomerConversation(
            req.body.orderId,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, conversation, 'Rider chat started');
    });

    /**
     * Get user's conversations
     */
    getConversations = asyncHandler(async (req: Request, res: Response) => {
        const conversations = await chatService.getUserConversations(
            req.user!._id.toString(),
            req.user!.role
        );
        return ResponseHandler.success(res, conversations, 'Conversations retrieved');
    });

    /**
     * Get conversation by ID
     */
    getConversation = asyncHandler(async (req: Request, res: Response) => {
        const conversation = await chatService.getConversationById(req.params.id as string);
        return ResponseHandler.success(res, conversation, 'Conversation retrieved');
    });

    /**
     * Get conversation messages
     */
    getMessages = asyncHandler(async (req: Request, res: Response) => {
        const result = await chatService.getMessages(
            req.params.id as string,
            req.user!._id.toString(),
            parseInt(req.query.page as string) || 1,
            parseInt(req.query.limit as string) || 50
        );
        return ResponseHandler.success(res, result, 'Messages retrieved');
    });

    /**
     * Send a message
     */
    sendMessage = asyncHandler(async (req: Request, res: Response) => {
        const message = await chatService.sendMessage({
            conversationId: req.params.id as string,
            senderId: req.user!._id.toString(),
            content: req.body.content,
            type: req.body.type,
            attachments: req.body.attachments,
            replyTo: req.body.replyTo
        });
        return ResponseHandler.created(res, message, 'Message sent');
    });

    /**
     * Close conversation
     */
    closeConversation = asyncHandler(async (req: Request, res: Response) => {
        const conversation = await chatService.closeConversation(
            req.params.id as string,
            req.user!._id.toString(),
            req.body.reason
        );
        return ResponseHandler.success(res, conversation, 'Conversation closed');
    });

    /**
     * Reopen conversation
     */
    reopenConversation = asyncHandler(async (req: Request, res: Response) => {
        const conversation = await chatService.reopenConversation(req.params.id as string);
        return ResponseHandler.success(res, conversation, 'Conversation reopened');
    });

    /**
     * Delete message
     */
    deleteMessage = asyncHandler(async (req: Request, res: Response) => {
        const message = await chatService.deleteMessage(
            req.params.messageId as string,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, message, 'Message deleted');
    });

    /**
     * Get unread count
     */
    getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
        const count = await chatService.getUnreadCount(req.user!._id.toString());
        return ResponseHandler.success(res, { unreadCount: count }, 'Unread count retrieved');
    });
}

export default new ChatController();
