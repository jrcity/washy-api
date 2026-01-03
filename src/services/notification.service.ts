/**
 * Notification Service - Push, SMS, WhatsApp, Email
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import Notification, { INotification } from '@/models/notification.model';
import User from '@/models/user.model';
import { CONFIGS } from '@/constants/configs.constant';
import { ENOTIFICATION_TYPE, ENOTIFICATION_CHANNEL, EORDER_STATUS } from '@/constants/enums.constant';

class NotificationService {
  // Send push notification
  async sendPush(userId: string, title: string, message: string, data?: any): Promise<INotification> {
    const user = await User.findById(userId);
    if (!user?.pushToken) throw new Error('No push token');

    const notification = await Notification.create({
      recipient: userId, title, message,
      type: ENOTIFICATION_TYPE.ORDER_STATUS,
      channel: ENOTIFICATION_CHANNEL.PUSH,
      pushData: { data }
    });

    // TODO: Implement actual push via OneSignal
    notification.isSent = true;
    notification.sentAt = new Date();
    await notification.save();
    return notification;
  }

  // Send SMS via Termii
  async sendSMS(phone: string, message: string, userId?: string): Promise<void> {
    await fetch(`${CONFIGS.SMS.TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone, from: CONFIGS.SMS.SENDER_ID, sms: message,
        type: 'plain', channel: 'generic', api_key: CONFIGS.SMS.TERMII_API_KEY
      })
    });

    if (userId) {
      await Notification.create({
        recipient: userId, title: 'SMS', message,
        type: ENOTIFICATION_TYPE.ORDER_STATUS,
        channel: ENOTIFICATION_CHANNEL.SMS,
        phoneNumber: phone, isSent: true, sentAt: new Date()
      });
    }
  }

  // Order status notification
  async notifyOrderStatus(userId: string, orderNumber: string, status: EORDER_STATUS, phone?: string) {
    const messages: Record<string, string> = {
      [EORDER_STATUS.CONFIRMED]: `Order ${orderNumber} confirmed. Pickup scheduled.`,
      [EORDER_STATUS.PICKED_UP]: `Your clothes have been picked up! Order: ${orderNumber}`,
      [EORDER_STATUS.IN_PROCESS]: `Your clothes are now being processed. Order: ${orderNumber}`,
      [EORDER_STATUS.READY]: `Great news! Order ${orderNumber} is ready for delivery.`,
      [EORDER_STATUS.OUT_FOR_DELIVERY]: `Your order ${orderNumber} is out for delivery!`,
      [EORDER_STATUS.DELIVERED]: `Order ${orderNumber} has been delivered. Thank you!`
    };

    const message = messages[status];
    if (!message) return;

    await this.sendPush(userId, 'Order Update', message, { orderNumber, status });
    if (phone) await this.sendSMS(phone, message, userId);
  }

  // Get user notifications
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: userId, channel: ENOTIFICATION_CHANNEL.PUSH })
        .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Notification.countDocuments({ recipient: userId, channel: ENOTIFICATION_CHANNEL.PUSH })
    ]);
    return { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) }};
  }

  // Mark as read
  async markAsRead(notificationId: string): Promise<void> {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true, readAt: new Date() });
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ recipient: userId, isRead: false, channel: ENOTIFICATION_CHANNEL.PUSH });
  }
}

export default new NotificationService();
