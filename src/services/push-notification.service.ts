/**
 * Firebase Admin Configuration
 * Push notification service
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import admin from 'firebase-admin';
import { Types } from 'mongoose';
import User from '@/models/user.model';
import Notification from '@/models/notification.model';
import { ENOTIFICATION_TYPE, ENOTIFICATION_CHANNEL } from '@/constants/enums.constant';

// Initialize Firebase Admin
let firebaseInitialized = false;

function initFirebase() {
    if (firebaseInitialized) return;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('Firebase credentials not configured. Push notifications disabled.');
        return;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey
            })
        });
        firebaseInitialized = true;
        console.log('Firebase Admin initialized');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize on import
initFirebase();

interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

interface SendPushOptions {
    userId: string;
    payload: PushNotificationPayload;
    type: ENOTIFICATION_TYPE;
    relatedId?: string;
    relatedModel?: string;
    saveToDb?: boolean;
}

class PushNotificationService {
    /**
     * Send push notification to a user
     */
    async sendToUser(options: SendPushOptions): Promise<boolean> {
        const { userId, payload, type, relatedId, relatedModel, saveToDb = true } = options;

        // Get user's FCM tokens
        const user = await User.findById(userId).select('fcmTokens deviceTokens');
        if (!user) {
            console.warn(`User ${userId} not found for push notification`);
            return false;
        }

        // Get all FCM tokens (from both possible fields)
        const tokens: string[] = [];
        if ((user as any).fcmTokens?.length) {
            tokens.push(...(user as any).fcmTokens);
        }
        if ((user as any).deviceTokens?.length) {
            tokens.push(...(user as any).deviceTokens.map((d: any) => d.token));
        }

        if (tokens.length === 0) {
            console.warn(`No FCM tokens for user ${userId}`);
            // Still save to DB for in-app notifications
            if (saveToDb) {
                await this.saveNotification(userId, payload, type, relatedId, relatedModel);
            }
            return false;
        }

        // Save to database for in-app notifications
        if (saveToDb) {
            await this.saveNotification(userId, payload, type, relatedId, relatedModel);
        }

        // Send via Firebase
        if (!firebaseInitialized) {
            console.warn('Firebase not initialized, skipping push');
            return false;
        }

        try {
            const message: admin.messaging.MulticastMessage = {
                tokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.imageUrl
                },
                data: payload.data || {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'washy_notifications'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            // Handle failed tokens (remove invalid ones)
            if (response.failureCount > 0) {
                const invalidTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success &&
                        (resp.error?.code === 'messaging/invalid-registration-token' ||
                            resp.error?.code === 'messaging/registration-token-not-registered')) {
                        invalidTokens.push(tokens[idx]);
                    }
                });

                if (invalidTokens.length > 0) {
                    await this.removeInvalidTokens(userId, invalidTokens);
                }
            }

            return response.successCount > 0;
        } catch (error) {
            console.error('Push notification error:', error);
            return false;
        }
    }

    /**
     * Send to multiple users
     */
    async sendToUsers(userIds: string[], payload: PushNotificationPayload, type: ENOTIFICATION_TYPE): Promise<void> {
        await Promise.all(
            userIds.map(userId =>
                this.sendToUser({ userId, payload, type, saveToDb: true })
            )
        );
    }

    /**
     * Send to topic (e.g., all riders in a branch)
     */
    async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
        if (!firebaseInitialized) return false;

        try {
            const message: admin.messaging.Message = {
                topic,
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                data: payload.data || {}
            };

            await admin.messaging().send(message);
            return true;
        } catch (error) {
            console.error('Topic push error:', error);
            return false;
        }
    }

    /**
     * Save notification to database
     */
    private async saveNotification(
        userId: string,
        payload: PushNotificationPayload,
        type: ENOTIFICATION_TYPE,
        relatedId?: string,
        relatedModel?: string
    ): Promise<void> {
        try {
            await Notification.create({
                recipient: new Types.ObjectId(userId),
                title: payload.title,
                message: payload.body,
                type,
                channel: ENOTIFICATION_CHANNEL.PUSH,
                pushData: {
                    data: payload.data
                },
                order: relatedModel === 'Order' && relatedId ? new Types.ObjectId(relatedId) : undefined
            });
        } catch (error) {
            console.error('Failed to save notification:', error);
        }
    }

    /**
     * Remove invalid FCM tokens
     */
    private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
        try {
            await User.findByIdAndUpdate(userId, {
                $pull: {
                    fcmTokens: { $in: invalidTokens },
                    deviceTokens: { token: { $in: invalidTokens } }
                }
            });
        } catch (error) {
            console.error('Failed to remove invalid tokens:', error);
        }
    }

    /**
     * Register FCM token for user
     */
    async registerToken(userId: string, token: string, deviceInfo?: { platform: string; deviceId: string }): Promise<void> {
        if (deviceInfo) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: {
                    deviceTokens: {
                        token,
                        platform: deviceInfo.platform,
                        deviceId: deviceInfo.deviceId,
                        lastUsed: new Date()
                    }
                }
            });
        } else {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { fcmTokens: token }
            });
        }
    }

    /**
     * Unregister FCM token
     */
    async unregisterToken(userId: string, token: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $pull: {
                fcmTokens: token,
                deviceTokens: { token }
            }
        });
    }

    // ============== NOTIFICATION TEMPLATES ==============

    /**
     * Order status update notification
     */
    async notifyOrderStatusUpdate(userId: string, orderId: string, orderNumber: string, newStatus: string): Promise<void> {
        const statusMessages: Record<string, string> = {
            confirmed: 'Your order has been confirmed and is being processed.',
            picked_up: 'Your laundry has been picked up!',
            in_process: 'Your laundry is being cleaned.',
            ready: 'Your laundry is ready for delivery!',
            out_for_delivery: 'Your laundry is on its way!',
            delivered: 'Your laundry has been delivered. Thank you!',
            completed: 'Your order is complete. We hope to serve you again!',
            cancelled: 'Your order has been cancelled.'
        };

        await this.sendToUser({
            userId,
            payload: {
                title: `Order #${orderNumber}`,
                body: statusMessages[newStatus] || `Order status updated to ${newStatus}`,
                data: { orderId, orderNumber, status: newStatus, type: 'ORDER_STATUS' }
            },
            type: ENOTIFICATION_TYPE.ORDER_STATUS,
            relatedId: orderId,
            relatedModel: 'Order'
        });
    }

    /**
     * New task assignment notification (for riders)
     */
    async notifyNewTask(riderId: string, taskId: string, taskType: string, orderNumber: string): Promise<void> {
        await this.sendToUser({
            userId: riderId,
            payload: {
                title: `New ${taskType} Task`,
                body: `You have been assigned a ${taskType.toLowerCase()} task for order #${orderNumber}`,
                data: { taskId, taskType, orderNumber, type: 'NEW_TASK' }
            },
            type: ENOTIFICATION_TYPE.SYSTEM,
            relatedId: taskId,
            relatedModel: 'Task'
        });
    }

    /**
     * Chat message notification
     */
    async notifyChatMessage(userId: string, conversationId: string, senderName: string, messagePreview: string): Promise<void> {
        await this.sendToUser({
            userId,
            payload: {
                title: senderName,
                body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
                data: { conversationId, type: 'CHAT_MESSAGE' }
            },
            type: ENOTIFICATION_TYPE.SYSTEM,
            relatedId: conversationId,
            relatedModel: 'ChatConversation',
            saveToDb: false // Don't save chat notifications to DB
        });
    }

    /**
     * Payment confirmation notification
     */
    async notifyPaymentSuccess(userId: string, orderId: string, orderNumber: string, amount: number): Promise<void> {
        await this.sendToUser({
            userId,
            payload: {
                title: 'Payment Successful',
                body: `₦${amount.toLocaleString()} payment received for order #${orderNumber}`,
                data: { orderId, orderNumber, amount: amount.toString(), type: 'PAYMENT' }
            },
            type: ENOTIFICATION_TYPE.PAYMENT,
            relatedId: orderId,
            relatedModel: 'Order'
        });
    }

    /**
     * Promotional notification
     */
    async notifyPromotion(userId: string, title: string, message: string, promoCode?: string): Promise<void> {
        await this.sendToUser({
            userId,
            payload: {
                title,
                body: message,
                data: { promoCode: promoCode || '', type: 'PROMOTION' }
            },
            type: ENOTIFICATION_TYPE.PROMOTION
        });
    }
}

export default new PushNotificationService();
