/**
 * Service Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { ServiceController } from '@/controllers';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { authenticate, authorize, requirePermission } from '@/middlewares/auth.middleware';
import { 
  createServiceValidation, updateServiceValidation, updatePricingValidation,
  serviceQueryValidation, calculatePriceValidation
} from '@/validations/service.validation';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

const router = Router();

// Public routes
router.get('/catalog', ServiceController.getPriceCatalog);
router.get('/active', ServiceController.getActiveServices);
router.get('/slug/:slug', ServiceController.getServiceBySlug);
router.get('/', validateQuery(serviceQueryValidation), ServiceController.getServices);
router.get('/:id', ServiceController.getService);
router.post('/calculate-price', validateBody(calculatePriceValidation), ServiceController.calculatePrice);

// Admin routes
router.use(authenticate);
router.post('/', requirePermission(EPERMISSIONS.MANAGE_SERVICES), 
  validateBody(createServiceValidation), ServiceController.createService);
router.patch('/:id', requirePermission(EPERMISSIONS.MANAGE_SERVICES), 
  validateBody(updateServiceValidation), ServiceController.updateService);
router.patch('/:id/pricing', requirePermission(EPERMISSIONS.MANAGE_SERVICES), 
  validateBody(updatePricingValidation), ServiceController.updatePricing);
router.delete('/:id', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN), ServiceController.deleteService);

// Seed services (super admin only)
router.post('/seed', authorize(EUSERS_ROLE.SUPER_ADMIN), ServiceController.seedServices);

export default router;
