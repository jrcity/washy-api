/**
 * Category Service
 * Business logic for service categories
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import Category, { ICategory } from '@/models/category.model';
import { deleteFromCloudinary } from '@/utils/cloudinary.util';
import { AppError } from '@/utils/error.util';

interface CreateCategoryInput {
  name: string;
  slug?: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  sortOrder?: number;
}

class CategoryService {

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<ICategory> {
    // Generate slug if not provided
    const slug = input.slug || this.generateSlug(input.name);
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw AppError.conflict('Category with this name already exists');
    }
    
    const category = await Category.create({
      ...input,
      slug
    });
    
    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<ICategory> {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    
    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await Category.findOne({ slug });
    
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    
    return category;
  }

  /**
   * Get all categories with filters
   */
  async getCategories(filters: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Category.countDocuments(query)
    ]);
    
    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get active categories
   */
  async getActiveCategories(): Promise<ICategory[]> {
    return Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<CreateCategoryInput>
  ): Promise<ICategory> {
    // If name is being updated, regenerate slug
    if (updates.name) {
      updates.slug = this.generateSlug(updates.name);
      
      // Check if new slug conflicts
      const existingCategory = await Category.findOne({ 
        slug: updates.slug,
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        throw AppError.conflict('Category with this name already exists');
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    
    return category;
  }

  /**
   * Update category image
   */
  async updateCategoryImage(
    categoryId: string,
    imageUrl: string,
    imagePublicId: string
  ): Promise<ICategory> {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    
    // Delete old image from Cloudinary if exists
    if (category.imagePublicId) {
      await deleteFromCloudinary(category.imagePublicId);
    }
    
    category.imageUrl = imageUrl;
    category.imagePublicId = imagePublicId;
    
    return category.save();
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    
    // Delete image from Cloudinary if exists
    if (category.imagePublicId) {
      await deleteFromCloudinary(category.imagePublicId);
    }
    
    category.isActive = false;
    await category.save();
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export default new CategoryService();
