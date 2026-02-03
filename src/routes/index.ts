/**
 * Route Index - Combines all routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import orderRoutes from './order.routes';
import branchRoutes from './branch.routes';
import serviceRoutes from './service.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import uploadRoutes from './upload.routes';
import categoryRoutes from './category.routes';
import UserRoutes from './user.routes';
import fileManagerRoutes from './file-manager.routes';
import analyticsRoutes from './analytics.routes';
import taskRoutes from './task.routes';
import rbacRoutes from './rbac.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Washy API v1'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/branches', branchRoutes);
router.use('/services', serviceRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', UserRoutes);
router.use('/file-manager', fileManagerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/tasks', taskRoutes);
router.use('/rbac', rbacRoutes);
router.use('/chat', chatRoutes);

export default router;

