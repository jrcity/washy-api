/**
 * Payment Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { PaymentController } from '@/controllers';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { 
  initializePaymentValidation, verifyPaymentValidation, paymentQueryValidation
} from '@/validations/payment.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// Webhook (no auth, but verify signature)
router.post('/webhook', PaymentController.paystackWebhook);

// Verify payment (can be called from callback)
router.get('/verify/:reference', PaymentController.verifyPayment);

// Authenticated routes
router.use(authenticate);
router.post('/initialize', validateBody(initializePaymentValidation), PaymentController.initializePayment);
router.get('/:id', PaymentController.getPayment);

// Admin routes
router.get('/', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER), 
  validateQuery(paymentQueryValidation), PaymentController.getPayments);
router.post('/cash', authorize(EUSERS_ROLE.STAFF, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.ADMIN), 
  PaymentController.recordCashPayment);

export default router;
