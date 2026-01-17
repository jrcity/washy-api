/**
 * Upload Middleware
 * Multer configuration for handling file uploads
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import multer from 'multer';
import { Request } from 'express';
import { AppError } from '@/utils/error.util';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 400));
  }
};

// Base multer configuration with memory storage (for Cloudinary streaming)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 files per request
  }
});

// Single file upload middleware
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => 
  upload.array(fieldName, maxCount);

// Multiple fields upload middleware
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

export default upload;
