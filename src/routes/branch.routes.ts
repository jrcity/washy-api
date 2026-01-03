/**
 * Branch Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import { BranchController } from '@/controllers';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { authenticate, authorize, requirePermission } from '@/middlewares/auth.middleware';
import { 
  createBranchValidation, updateBranchValidation, addCoverageZoneValidation,
  assignManagerValidation, assignStaffValidation, branchQueryValidation
} from '@/validations/branch.validation';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

const router = Router();

// Public routes
router.get('/find-by-zone', BranchController.findByZone);
router.get('/', validateQuery(branchQueryValidation), BranchController.getBranches);
router.get('/:id', BranchController.getBranch);

// Admin routes
router.use(authenticate);
router.post('/', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN), 
  validateBody(createBranchValidation), BranchController.createBranch);
router.patch('/:id', requirePermission(EPERMISSIONS.MANAGE_BRANCHES), 
  validateBody(updateBranchValidation), BranchController.updateBranch);
router.delete('/:id', authorize(EUSERS_ROLE.SUPER_ADMIN), BranchController.deleteBranch);

// Branch management
router.post('/:id/assign-manager', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN), 
  validateBody(assignManagerValidation), BranchController.assignManager);
router.post('/:id/coverage-zones', requirePermission(EPERMISSIONS.MANAGE_BRANCHES), 
  validateBody(addCoverageZoneValidation), BranchController.addCoverageZones);
router.post('/:id/assign-staff', requirePermission(EPERMISSIONS.MANAGE_STAFF), 
  validateBody(assignStaffValidation), BranchController.assignStaff);
router.get('/:id/stats', authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER), 
  BranchController.getBranchStats);

export default router;
