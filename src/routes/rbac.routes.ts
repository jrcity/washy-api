/**
 * RBAC Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import RBACController from '@/controllers/rbac.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { createPolicyValidation, updatePolicyValidation, policyQueryValidation } from '@/validations/rbac.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// All RBAC routes require authentication and super admin access
router.use(authenticate);
router.use(authorize(EUSERS_ROLE.SUPER_ADMIN));

// Policy management
router.post('/', validateBody(createPolicyValidation), RBACController.createPolicy);
router.get('/', validateQuery(policyQueryValidation), RBACController.getPolicies);
router.get('/:id', RBACController.getPolicy);
router.patch('/:id', validateBody(updatePolicyValidation), RBACController.updatePolicy);
router.delete('/:id', RBACController.deletePolicy);

// Toggle policy status
router.patch('/:id/toggle', RBACController.toggleStatus);

// Test access
router.post('/check-access', RBACController.checkAccess);

export default router;
