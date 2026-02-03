/**
 * FileManager Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import FileManagerController from '@/controllers/file-manager.controller';
import { validateBody, validateQuery, uploadSingle, uploadMultiple } from '@/middlewares';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    uploadFileValidation,
    fileQueryValidation,
    updateTagsValidation,
    moveFolderValidation,
    bulkArchiveValidation,
    updateRelationValidation
} from '@/validations/file-manager.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// All file manager routes require authentication
router.use(authenticate);

// Admin/Super Admin only routes
router.use(authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN));

// Upload single file
router.post('/',
    uploadSingle('file'),
    validateBody(uploadFileValidation),
    FileManagerController.uploadFile
);

// Upload multiple files
router.post('/multiple',
    uploadMultiple('files', 10),
    validateBody(uploadFileValidation),
    FileManagerController.uploadMultiple
);

// Get all files with filters
router.get('/',
    validateQuery(fileQueryValidation),
    FileManagerController.getFiles
);

// Get storage statistics
router.get('/stats', FileManagerController.getStorageStats);

// Get files related to entity
router.get('/related/:model/:modelId', FileManagerController.getRelatedFiles);

// Get single file
router.get('/:id', FileManagerController.getFile);

// Update file tags
router.patch('/:id/tags',
    validateBody(updateTagsValidation),
    FileManagerController.updateTags
);

// Move file to folder
router.patch('/:id/folder',
    validateBody(moveFolderValidation),
    FileManagerController.moveToFolder
);

// Archive file
router.patch('/:id/archive', FileManagerController.archiveFile);

// Restore archived file
router.patch('/:id/restore', FileManagerController.restoreFile);

// Update file relation
router.patch('/:id/relation',
    validateBody(updateRelationValidation),
    FileManagerController.updateRelation
);

// Bulk archive files
router.post('/bulk-archive',
    validateBody(bulkArchiveValidation),
    FileManagerController.bulkArchive
);

// Delete file permanently (Super Admin only)
router.delete('/:id',
    authorize(EUSERS_ROLE.SUPER_ADMIN),
    FileManagerController.deleteFile
);

export default router;
