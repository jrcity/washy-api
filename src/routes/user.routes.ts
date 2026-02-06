/**
 * User Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { UserController } from '@/controllers';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validateBody } from '@/middlewares/validation.middleware';
import { createInternalUserValidation } from '@/validations/user.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// Protect all routes
router.use(authenticate);

// Create staff/rider (Admin/SuperAdmin/BranchManager)
router.post('/internal',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER),
    validateBody(createInternalUserValidation),
    UserController.createInternalUser
);

// Get all users
// The user request specially mentioned role=staff, so likely admin wants to see staff.
// Allowing ADMIN, SUPER_ADMIN, BRANCH_MANAGER to list users.
router.get('/', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER), UserController.getUsers);

// Get single user
router.get('/:id', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER), UserController.getUser);

// Update user
router.patch('/:id', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN), UserController.updateUser);

// Delete user
router.delete('/:id', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN), UserController.deleteUser);

export default router;
