/**
 * Notification Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { NotificationController } from '@/controllers';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;
