/**
 * Task Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import TaskController from '@/controllers/task.controller';
import { authenticate, authorize, requirePermission } from '@/middlewares/auth.middleware';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { createTaskValidation, assignTaskValidation, revokeTaskValidation, taskQueryValidation } from '@/validations/task.validation';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Rider routes
router.get('/my-tasks', authorize(EUSERS_ROLE.RIDER), TaskController.getMyTasks);
router.patch('/:id/start', authorize(EUSERS_ROLE.RIDER), TaskController.startTask);
router.patch('/:id/complete', authorize(EUSERS_ROLE.RIDER), TaskController.completeTask);

// Admin/Manager/Staff routes
router.post('/',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF),
    validateBody(createTaskValidation),
    TaskController.createTask
);

router.get('/',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF),
    validateQuery(taskQueryValidation),
    TaskController.getTasks
);

router.get('/unassigned',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF),
    TaskController.getUnassignedTasks
);

router.get('/available-riders',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF),
    TaskController.getAvailableRiders
);

router.get('/:id',
    authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF, EUSERS_ROLE.RIDER),
    TaskController.getTask
);

// Assignment operations (requires permission)
router.patch('/:id/assign',
    requirePermission(EPERMISSIONS.MANAGE_PICKUP_DELIVERY),
    validateBody(assignTaskValidation),
    TaskController.assignTask
);

router.patch('/:id/revoke',
    requirePermission(EPERMISSIONS.MANAGE_PICKUP_DELIVERY),
    validateBody(revokeTaskValidation),
    TaskController.revokeTask
);

export default router;
