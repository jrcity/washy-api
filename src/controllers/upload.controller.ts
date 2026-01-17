/**
 * Upload Controller
 * HTTP handlers for file uploads
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response } from 'express';
import uploadService from '@/services/upload.service';
import { ResponseHandler, asyncHandler } from '@/utils';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

class UploadController {

  /**
   * Upload a single file
   * POST /api/uploads
   */
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHandler.badRequest(res, 'No file uploaded');
    }

    const { category, relatedModel, relatedId } = req.body;
    const userId = req.user!._id.toString();

    const upload = await uploadService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      category: category as EUPLOAD_CATEGORY,
      userId,
      relatedModel,
      relatedId
    });

    return ResponseHandler.created(res, upload, 'File uploaded successfully');
  });

  /**
   * Upload multiple files
   * POST /api/uploads/multiple
   */
  uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return ResponseHandler.badRequest(res, 'No files uploaded');
    }

    const { category, relatedModel, relatedId } = req.body;
    const userId = req.user!._id.toString();

    const uploads = await uploadService.uploadMultiple(
      req.files as Express.Multer.File[],
      category as EUPLOAD_CATEGORY,
      userId,
      relatedModel,
      relatedId
    );

    return ResponseHandler.created(res, uploads, `${uploads.length} files uploaded successfully`);
  });

  /**
   * Get upload by ID
   * GET /api/uploads/:id
   */
  getUpload = asyncHandler(async (req: Request, res: Response) => {
    const upload = await uploadService.getUploadById(req.params.id);
    return ResponseHandler.success(res, upload);
  });

  /**
   * Get all uploads with filters
   * GET /api/uploads
   */
  getUploads = asyncHandler(async (req: Request, res: Response) => {
    const { category, relatedModel, relatedId, page, limit } = req.query;

    const result = await uploadService.getUploads({
      category: category as EUPLOAD_CATEGORY | undefined,
      relatedModel: relatedModel as string | undefined,
      relatedId: relatedId as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    return ResponseHandler.success(res, result);
  });

  /**
   * Delete an upload
   * DELETE /api/uploads/:id
   */
  deleteUpload = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    await uploadService.deleteUpload(req.params.id, userId);
    return ResponseHandler.success(res, null, 'Upload deleted successfully');
  });

  /**
   * Update upload relation
   * PATCH /api/uploads/:id/relation
   */
  updateRelation = asyncHandler(async (req: Request, res: Response) => {
    const { relatedModel, relatedId } = req.body;
    
    const upload = await uploadService.updateUploadRelation(
      req.params.id,
      relatedModel,
      relatedId
    );

    return ResponseHandler.success(res, upload, 'Upload relation updated');
  });
}

export default new UploadController();
