/**
 * Upload Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import UploadController from '@/controllers/upload.controller';
import { validateBody, validateQuery, uploadSingle, uploadMultiple } from '@/middlewares';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { 
  uploadFileValidation, 
  uploadQueryValidation, 
  updateUploadRelationValidation 
} from '@/validations/upload.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload single file
router.post('/', 
  uploadSingle('file'),
  validateBody(uploadFileValidation),
  UploadController.uploadFile
);

// Upload multiple files
router.post('/multiple', 
  uploadMultiple('files', 10),
  validateBody(uploadFileValidation),
  UploadController.uploadMultiple
);

// Get all uploads (admin only)
router.get('/', 
  authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER),
  validateQuery(uploadQueryValidation),
  UploadController.getUploads
);

// Get single upload
router.get('/:id', UploadController.getUpload);

// Update upload relation
router.patch('/:id/relation', 
  validateBody(updateUploadRelationValidation),
  UploadController.updateRelation
);

// Delete upload
router.delete('/:id', UploadController.deleteUpload);

export default router;
