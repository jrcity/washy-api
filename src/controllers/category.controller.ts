/**
 * Category Controller
 * HTTP handlers for service categories
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response } from 'express';
import categoryService from '@/services/category.service';
import uploadService from '@/services/upload.service';
import { ResponseHandler, asyncHandler, uploadToCloudinary } from '@/utils';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

class CategoryController {

  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    return ResponseHandler.created(res, category, 'Category created successfully');
  });

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  getCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(req.params.id);
    return ResponseHandler.success(res, category);
  });

  /**
   * Get category by slug
   * GET /api/categories/slug/:slug
   */
  getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    return ResponseHandler.success(res, category);
  });

  /**
   * Get all categories
   * GET /api/categories
   */
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, page, limit } = req.query;

    const result = await categoryService.getCategories({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    return ResponseHandler.success(res, result);
  });

  /**
   * Get active categories (public)
   * GET /api/categories/active
   */
  getActiveCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.getActiveCategories();
    return ResponseHandler.success(res, categories);
  });

  /**
   * Update category
   * PATCH /api/categories/:id
   */
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return ResponseHandler.success(res, category, 'Category updated successfully');
  });

  /**
   * Upload category image
   * PATCH /api/categories/:id/image
   */
  uploadCategoryImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHandler.badRequest(res, 'No image uploaded');
    }

    const userId = req.user!._id.toString();
    const categoryId = req.params.id;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      EUPLOAD_CATEGORY.CATEGORY_IMAGE
    );

    // Update category with new image
    const category = await categoryService.updateCategoryImage(
      categoryId,
      result.url,
      result.publicId
    );

    // Save upload record
    await uploadService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      category: EUPLOAD_CATEGORY.CATEGORY_IMAGE,
      userId,
      relatedModel: 'Category',
      relatedId: categoryId
    });

    return ResponseHandler.success(res, category, 'Category image uploaded successfully');
  });

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id);
    return ResponseHandler.success(res, null, 'Category deleted successfully');
  });
}

export default new CategoryController();
