/**
 * Upload Model
 * Tracks all file uploads with metadata
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

export interface IUpload extends Document {
  url: string;                         // Cloudinary secure URL
  publicId: string;                    // Cloudinary public ID for deletion
  category: EUPLOAD_CATEGORY;          // Upload category
  originalName: string;                // Original filename
  format: string;                      // File format (jpg, png, etc.)
  size: number;                        // File size in bytes
  width?: number;                      // Image width
  height?: number;                     // Image height
  uploadedBy: Types.ObjectId;          // User who uploaded
  relatedModel?: string;               // Related model name (Service, Category, Order)
  relatedId?: Types.ObjectId;          // Related document ID
  isDeleted: boolean;                  // Soft delete flag
  deletedAt?: Date;
}

const uploadSchema = new Schema<IUpload>({
  url: {
    type: String,
    required: [true, 'URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required'],
    unique: true
  },
  category: {
    type: String,
    enum: Object.values(EUPLOAD_CATEGORY),
    required: [true, 'Category is required']
  },
  originalName: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: Number,
  height: Number,
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  relatedModel: {
    type: String,
    enum: ['Service', 'Category', 'Order']
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
uploadSchema.index({ category: 1 });
uploadSchema.index({ uploadedBy: 1 });
uploadSchema.index({ relatedModel: 1, relatedId: 1 });
uploadSchema.index({ isDeleted: 1, createdAt: -1 });

// Soft delete method
uploadSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const Upload = mongoose.model<IUpload>('Upload', uploadSchema);
export default Upload;
