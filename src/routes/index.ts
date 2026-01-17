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

export default router;
