/**
 * Order Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { OrderController } from '@/controllers';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { authenticate, authorize, requirePermission } from '@/middlewares/auth.middleware';
import { 
  createOrderValidation, updateOrderStatusValidation, assignRiderValidation,
  deliveryProofValidation, orderRatingValidation, cancelOrderValidation, orderQueryValidation
} from '@/validations/order.validation';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

const router = Router();

// Customer routes
router.use(authenticate);
router.post('/', validateBody(createOrderValidation), OrderController.createOrder);
router.get('/my-orders', OrderController.getMyOrders);
router.get('/:id', OrderController.getOrder);
router.post('/:id/rate', validateBody(orderRatingValidation), OrderController.rateOrder);
router.post('/:id/cancel', validateBody(cancelOrderValidation), OrderController.cancelOrder);

// Staff/Admin routes
router.get('/', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF), 
  validateQuery(orderQueryValidation), OrderController.getOrders);
router.patch('/:id/status', requirePermission(EPERMISSIONS.UPDATE_ORDER_STATUS), 
  validateBody(updateOrderStatusValidation), OrderController.updateOrderStatus);
router.post('/:id/assign-rider', requirePermission(EPERMISSIONS.MANAGE_PICKUP_DELIVERY), 
  validateBody(assignRiderValidation), OrderController.assignRider);
router.post('/:id/generate-otp', requirePermission(EPERMISSIONS.MANAGE_PICKUP_DELIVERY), OrderController.generateDeliveryOtp);

// Rider routes
router.post('/:id/verify-delivery', authorize(EUSERS_ROLE.RIDER), 
  validateBody(deliveryProofValidation), OrderController.verifyDelivery);

// Admin stats
router.get('/stats/overview', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER), 
  OrderController.getOrderStats);

export default router;
