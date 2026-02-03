/**
 * Chat Service
 * Business logic for chat operations
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import { ChatConversation, ChatMessage, IChatConversation, IChatMessage } from '@/models/chat.model';
import Order from '@/models/order.model';
import { AppError } from '@/utils/error.util';
import { ECHAT_TYPE, EMESSAGE_STATUS, EMESSAGE_TYPE, EPAYMENT_STATUS, EUSERS_ROLE } from '@/constants/enums.constant';

interface CreateConversationInput {
    type: ECHAT_TYPE;
    participants: string[];
    orderId?: string;
    branchId?: string;
}

interface SendMessageInput {
    conversationId: string;
    senderId: string;
    content: string;
    type?: EMESSAGE_TYPE;
    attachments?: any[];
    replyTo?: string;
}

class ChatService {
    /**
     * Create or get existing conversation for customer-support
     */
    async getOrCreateSupportConversation(customerId: string, branchId: string): Promise<IChatConversation> {
        // Check for existing active conversation
        let conversation = await ChatConversation.findOne({
            type: ECHAT_TYPE.SUPPORT,
            participants: new Types.ObjectId(customerId),
            branch: new Types.ObjectId(branchId),
            isActive: true
        });

        if (conversation) {
            return conversation;
        }

        // Create new conversation
        conversation = await ChatConversation.create({
            type: ECHAT_TYPE.SUPPORT,
            participants: [new Types.ObjectId(customerId)],
            branch: new Types.ObjectId(branchId)
        });

        return conversation;
    }

    /**
     * Create or get rider-customer conversation
     * Only allowed after customer has made payment
     */
    async getOrCreateRiderCustomerConversation(orderId: string, riderId: string): Promise<IChatConversation> {
        // Verify order exists and has payment
        const order = await Order.findById(orderId);
        if (!order) {
            throw AppError.notFound('Order not found');
        }

        // Check if order is beyond confirmed (payment validated by order status)
        const validStatuses = ['in_process', 'ready', 'out_for_delivery', 'delivered', 'completed'];
        if (!validStatuses.includes(order.status)) {
            throw AppError.forbidden('Chat is only available after order is in process');
        }

        // Verify rider is assigned to this order
        const isAssigned = (order.pickupRider?.toString() === riderId) ||
            (order.deliveryRider?.toString() === riderId);
        if (!isAssigned) {
            throw AppError.forbidden('You are not assigned to this order');
        }

        // Check for existing conversation
        let conversation = await ChatConversation.findOne({
            type: ECHAT_TYPE.RIDER_CUSTOMER,
            order: new Types.ObjectId(orderId),
            isActive: true
        });

        if (conversation) {
            return conversation;
        }

        // Create new conversation
        conversation = await ChatConversation.create({
            type: ECHAT_TYPE.RIDER_CUSTOMER,
            participants: [new Types.ObjectId(riderId), order.customer],
            order: new Types.ObjectId(orderId),
            branch: order.branch
        });

        return conversation;
    }

    /**
     * Send a message
     */
    async sendMessage(input: SendMessageInput): Promise<IChatMessage> {
        const conversation = await ChatConversation.findById(input.conversationId);
        if (!conversation) {
            throw AppError.notFound('Conversation not found');
        }

        if (!conversation.isActive) {
            throw AppError.badRequest('This conversation is closed');
        }

        const message = await ChatMessage.create({
            conversation: input.conversationId,
            sender: input.senderId,
            content: input.content,
            type: input.type || EMESSAGE_TYPE.TEXT,
            attachments: input.attachments,
            replyTo: input.replyTo ? new Types.ObjectId(input.replyTo) : undefined
        });

        // Update conversation
        conversation.lastMessage = message._id as Types.ObjectId;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        return message.populate('sender', 'name role');
    }

    /**
     * Get conversation messages
     */
    async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            throw AppError.notFound('Conversation not found');
        }

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            ChatMessage.find({
                conversation: conversationId,
                deletedAt: { $exists: false }
            })
                .populate('sender', 'name role')
                .populate('replyTo', 'content sender')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ChatMessage.countDocuments({ conversation: conversationId, deletedAt: { $exists: false } })
        ]);

        // Mark messages as read
        await ChatMessage.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: new Types.ObjectId(userId) },
                'readBy.user': { $ne: new Types.ObjectId(userId) }
            },
            {
                $push: { readBy: { user: new Types.ObjectId(userId), readAt: new Date() } },
                $set: { status: EMESSAGE_STATUS.READ }
            }
        );

        return {
            messages: messages.reverse(), // Return in chronological order
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    }

    /**
     * Get user's conversations
     */
    async getUserConversations(userId: string, role: EUSERS_ROLE) {
        let query: any = {};

        if (role === EUSERS_ROLE.CUSTOMER) {
            query.participants = new Types.ObjectId(userId);
        } else if (role === EUSERS_ROLE.RIDER) {
            query = {
                type: ECHAT_TYPE.RIDER_CUSTOMER,
                participants: new Types.ObjectId(userId)
            };
        } else if ([EUSERS_ROLE.STAFF, EUSERS_ROLE.BRANCH_MANAGER].includes(role)) {
            // Staff see support conversations for their branch
            query.type = ECHAT_TYPE.SUPPORT;
        }

        const conversations = await ChatConversation.find(query)
            .populate('participants', 'name role')
            .populate('lastMessage', 'content createdAt sender')
            .populate('order', 'orderNumber status')
            .populate('branch', 'name')
            .sort({ lastMessageAt: -1 });

        // Get unread counts
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await ChatMessage.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: new Types.ObjectId(userId) },
                    'readBy.user': { $ne: new Types.ObjectId(userId) }
                });
                return { ...conv.toObject(), unreadCount };
            })
        );

        return conversationsWithUnread;
    }

    /**
     * Close conversation
     */
    async closeConversation(conversationId: string, closedBy: string, reason?: string): Promise<IChatConversation> {
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            throw AppError.notFound('Conversation not found');
        }

        conversation.isActive = false;
        conversation.closedAt = new Date();
        conversation.closedBy = new Types.ObjectId(closedBy);
        conversation.closureReason = reason;
        await conversation.save();

        return conversation;
    }

    /**
     * Reopen conversation
     */
    async reopenConversation(conversationId: string): Promise<IChatConversation> {
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            throw AppError.notFound('Conversation not found');
        }

        conversation.isActive = true;
        conversation.closedAt = undefined;
        conversation.closedBy = undefined;
        conversation.closureReason = undefined;
        await conversation.save();

        return conversation;
    }

    /**
     * Delete message (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<IChatMessage> {
        const message = await ChatMessage.findById(messageId);
        if (!message) {
            throw AppError.notFound('Message not found');
        }

        if (message.sender.toString() !== userId) {
            throw AppError.forbidden('You can only delete your own messages');
        }

        message.deletedAt = new Date();
        message.deletedBy = new Types.ObjectId(userId);
        message.content = 'This message was deleted';
        await message.save();

        return message;
    }

    /**
     * Get conversation by ID
     */
    async getConversationById(conversationId: string): Promise<IChatConversation> {
        const conversation = await ChatConversation.findById(conversationId)
            .populate('participants', 'name role phone')
            .populate('order', 'orderNumber status total')
            .populate('branch', 'name code');

        if (!conversation) {
            throw AppError.notFound('Conversation not found');
        }

        return conversation;
    }

    /**
     * Get unread message count for user
     */
    async getUnreadCount(userId: string): Promise<number> {
        // Get user's conversations
        const conversations = await ChatConversation.find({
            participants: new Types.ObjectId(userId),
            isActive: true
        }).select('_id');

        const conversationIds = conversations.map(c => c._id);

        const count = await ChatMessage.countDocuments({
            conversation: { $in: conversationIds },
            sender: { $ne: new Types.ObjectId(userId) },
            'readBy.user': { $ne: new Types.ObjectId(userId) }
        });

        return count;
    }
}

export default new ChatService();
