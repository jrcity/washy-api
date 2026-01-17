/**
 * Category Model
 * Service categories with image support
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;           // Category display image
  imagePublicId?: string;      // Cloudinary public ID for deletion
  isActive: boolean;
  sortOrder: number;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  imageUrl: String,
  imagePublicId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes (slug and name already indexed via unique: true)
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Pre-save hook to generate slug
categorySchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Static method to get active categories
categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;
