/**
 * Chat Models
 * Real-time messaging with channels
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ECHAT_TYPE, EMESSAGE_STATUS, EMESSAGE_TYPE } from '@/constants/enums.constant';

// Chat Conversation Model
export interface IChatConversation extends Document {
    type: ECHAT_TYPE;
    participants: Types.ObjectId[];
    order?: Types.ObjectId;                   // For rider-customer chat
    branch?: Types.ObjectId;                  // For customer-support chat
    lastMessage?: Types.ObjectId;
    lastMessageAt?: Date;
    isActive: boolean;
    closedAt?: Date;
    closedBy?: Types.ObjectId;
    closureReason?: string;
    metadata?: Record<string, any>;
}

const conversationSchema = new Schema<IChatConversation>({
    type: {
        type: String,
        enum: Object.values(ECHAT_TYPE),
        required: [true, 'Chat type is required']
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch'
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    lastMessageAt: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    closedAt: Date,
    closedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    closureReason: String,
    metadata: Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1, isActive: 1 });
conversationSchema.index({ order: 1 }, { sparse: true });
conversationSchema.index({ branch: 1, type: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const ChatConversation = mongoose.model<IChatConversation>('ChatConversation', conversationSchema);

// Chat Message Model
export interface IChatMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    type: EMESSAGE_TYPE;
    attachments?: {
        url: string;
        publicId?: string;
        type: string;
        name: string;
        size: number;
    }[];
    status: EMESSAGE_STATUS;
    readBy: {
        user: Types.ObjectId;
        readAt: Date;
    }[];
    editedAt?: Date;
    deletedAt?: Date;
    deletedBy?: Types.ObjectId;
    replyTo?: Types.ObjectId;
    metadata?: Record<string, any>;
}

const messageSchema = new Schema<IChatMessage>({
    conversation: {
        type: Schema.Types.ObjectId,
        ref: 'ChatConversation',
        required: [true, 'Conversation is required']
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required']
    },
    content: {
        type: String,
        required: function (this: IChatMessage) {
            return this.type === EMESSAGE_TYPE.TEXT;
        },
        maxlength: [2000, 'Message too long']
    },
    type: {
        type: String,
        enum: Object.values(EMESSAGE_TYPE),
        default: EMESSAGE_TYPE.TEXT
    },
    attachments: [{
        url: String,
        publicId: String,
        type: String,
        name: String,
        size: Number
    }],
    status: {
        type: String,
        enum: Object.values(EMESSAGE_STATUS),
        default: EMESSAGE_STATUS.SENT
    },
    readBy: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    editedAt: Date,
    deletedAt: Date,
    deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    metadata: Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });

// Mark message as read
messageSchema.methods.markAsRead = function (userId: Types.ObjectId) {
    const alreadyRead = this.readBy.some((r: any) => r.user.toString() === userId.toString());
    if (!alreadyRead) {
        this.readBy.push({ user: userId, readAt: new Date() });
        this.status = EMESSAGE_STATUS.READ;
    }
    return this.save();
};

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', messageSchema);

export default { ChatConversation, ChatMessage };
