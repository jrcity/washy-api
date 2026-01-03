/**
 * Notification Model
 * Multi-channel notifications (Push, SMS, Email, WhatsApp)
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ENOTIFICATION_TYPE, ENOTIFICATION_CHANNEL } from '@/constants/enums.constant';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  
  // Notification content
  title: string;
  message: string;
  body?: string;                           // Extended content for email
  
  // Type and channel
  type: ENOTIFICATION_TYPE;
  channel: ENOTIFICATION_CHANNEL;
  
  // Related entities
  order?: Types.ObjectId;
  payment?: Types.ObjectId;
  
  // Delivery status
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
  
  // For push notifications
  pushData?: {
    badge?: number;
    sound?: string;
    data?: Record<string, any>;
    clickAction?: string;
  };
  
  // For SMS/WhatsApp
  phoneNumber?: string;
  
  // For Email
  emailDetails?: {
    from?: string;
    to: string;
    subject: string;
    template?: string;
    templateData?: Record<string, any>;
  };
  
  // Delivery attempts
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  failureReason?: string;
  
  // Expiry
  expiresAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  body: String,
  type: {
    type: String,
    enum: Object.values(ENOTIFICATION_TYPE),
    required: true
  },
  channel: {
    type: String,
    enum: Object.values(ENOTIFICATION_CHANNEL),
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: Date,
  readAt: Date,
  pushData: {
    badge: Number,
    sound: { type: String, default: 'default' },
    data: Schema.Types.Mixed,
    clickAction: String
  },
  phoneNumber: String,
  emailDetails: {
    from: String,
    to: String,
    subject: String,
    template: String,
    templateData: Schema.Types.Mixed
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date,
  failureReason: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ channel: 1, isSent: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ order: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.isSent = true;
  this.sentAt = new Date();
  return this.save();
};

// Method to record delivery attempt
notificationSchema.methods.recordAttempt = function(success: boolean, failureReason?: string) {
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  
  if (success) {
    this.isSent = true;
    this.sentAt = new Date();
  } else if (failureReason) {
    this.failureReason = failureReason;
  }
  
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId: Types.ObjectId) {
  return this.countDocuments({ 
    recipient: recipientId, 
    isRead: false,
    channel: ENOTIFICATION_CHANNEL.PUSH
  });
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
