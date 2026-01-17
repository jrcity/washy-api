/**
 * Category Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import CategoryController from '@/controllers/category.controller';
import { validateBody, validateQuery, uploadSingle } from '@/middlewares';
import { authenticate, authorize, requirePermission } from '@/middlewares/auth.middleware';
import { 
  createCategoryValidation, 
  updateCategoryValidation, 
  categoryQueryValidation 
} from '@/validations/category.validation';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

const router = Router();

// Public routes
router.get('/active', CategoryController.getActiveCategories);
router.get('/slug/:slug', CategoryController.getCategoryBySlug);
router.get('/', validateQuery(categoryQueryValidation), CategoryController.getCategories);
router.get('/:id', CategoryController.getCategory);

// Admin routes
router.use(authenticate);

router.post('/', 
  requirePermission(EPERMISSIONS.MANAGE_SERVICES),
  validateBody(createCategoryValidation),
  CategoryController.createCategory
);

router.patch('/:id', 
  requirePermission(EPERMISSIONS.MANAGE_SERVICES),
  validateBody(updateCategoryValidation),
  CategoryController.updateCategory
);

router.patch('/:id/image', 
  requirePermission(EPERMISSIONS.MANAGE_SERVICES),
  uploadSingle('image'),
  CategoryController.uploadCategoryImage
);

router.delete('/:id', 
  authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN),
  CategoryController.deleteCategory
);

export default router;
