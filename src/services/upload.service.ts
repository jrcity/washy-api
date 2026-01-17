/**
 * Upload Service
 * Business logic for file uploads
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Upload, { IUpload } from '@/models/upload.model';
import { uploadToCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary } from '@/utils/cloudinary.util';
import { AppError } from '@/utils/error.util';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  category: EUPLOAD_CATEGORY;
  userId: string;
  relatedModel?: 'Service' | 'Category' | 'Order';
  relatedId?: string;
}

class UploadService {

  /**
   * Upload a single file
   */
  async uploadFile(input: UploadFileInput): Promise<IUpload> {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      input.buffer,
      input.originalName,
      input.category
    );
    
    // Save upload record
    const upload = await Upload.create({
      url: result.url,
      publicId: result.publicId,
      category: input.category,
      originalName: input.originalName,
      format: result.format,
      size: result.size,
      width: result.width,
      height: result.height,
      uploadedBy: new Types.ObjectId(input.userId),
      relatedModel: input.relatedModel,
      relatedId: input.relatedId ? new Types.ObjectId(input.relatedId) : undefined
    });
    
    return upload;
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: Array<{ buffer: Buffer; originalname: string }>,
    category: EUPLOAD_CATEGORY,
    userId: string,
    relatedModel?: 'Service' | 'Category' | 'Order',
    relatedId?: string
  ): Promise<IUpload[]> {
    const uploads: IUpload[] = [];
    
    for (const file of files) {
      const upload = await this.uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        category,
        userId,
        relatedModel,
        relatedId
      });
      uploads.push(upload);
    }
    
    return uploads;
  }

  /**
   * Get upload by ID
   */
  async getUploadById(uploadId: string): Promise<IUpload> {
    const upload = await Upload.findOne({ 
      _id: uploadId, 
      isDeleted: false 
    }).populate('uploadedBy', 'firstName lastName email');
    
    if (!upload) {
      throw AppError.notFound('Upload not found');
    }
    
    return upload;
  }

  /**
   * Get uploads with filters
   */
  async getUploads(filters: {
    category?: EUPLOAD_CATEGORY;
    relatedModel?: string;
    relatedId?: string;
    uploadedBy?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = { isDeleted: false };
    
    if (filters.category) query.category = filters.category;
    if (filters.relatedModel) query.relatedModel = filters.relatedModel;
    if (filters.relatedId) query.relatedId = new Types.ObjectId(filters.relatedId);
    if (filters.uploadedBy) query.uploadedBy = new Types.ObjectId(filters.uploadedBy);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [uploads, total] = await Promise.all([
      Upload.find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Upload.countDocuments(query)
    ]);
    
    return {
      uploads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get uploads by relation
   */
  async getUploadsByRelation(
    relatedModel: string,
    relatedId: string
  ): Promise<IUpload[]> {
    return Upload.find({
      relatedModel,
      relatedId: new Types.ObjectId(relatedId),
      isDeleted: false
    }).sort({ createdAt: -1 });
  }

  /**
   * Delete an upload
   */
  async deleteUpload(uploadId: string, userId: string): Promise<void> {
    const upload = await Upload.findOne({ 
      _id: uploadId, 
      isDeleted: false 
    });
    
    if (!upload) {
      throw AppError.notFound('Upload not found');
    }
    
    // Delete from Cloudinary
    await deleteFromCloudinary(upload.publicId);
    
    // Soft delete the record
    upload.isDeleted = true;
    upload.deletedAt = new Date();
    await upload.save();
  }

  /**
   * Delete multiple uploads by relation
   */
  async deleteUploadsByRelation(
    relatedModel: string,
    relatedId: string
  ): Promise<void> {
    const uploads = await Upload.find({
      relatedModel,
      relatedId: new Types.ObjectId(relatedId),
      isDeleted: false
    });
    
    if (uploads.length === 0) return;
    
    // Delete from Cloudinary
    const publicIds = uploads.map(u => u.publicId);
    await deleteMultipleFromCloudinary(publicIds);
    
    // Soft delete all records
    await Upload.updateMany(
      { _id: { $in: uploads.map(u => u._id) } },
      { isDeleted: true, deletedAt: new Date() }
    );
  }

  /**
   * Update upload relation
   */
  async updateUploadRelation(
    uploadId: string,
    relatedModel: 'Service' | 'Category' | 'Order',
    relatedId: string
  ): Promise<IUpload> {
    const upload = await Upload.findByIdAndUpdate(
      uploadId,
      { 
        relatedModel, 
        relatedId: new Types.ObjectId(relatedId) 
      },
      { new: true }
    );
    
    if (!upload) {
      throw AppError.notFound('Upload not found');
    }
    
    return upload;
  }
}

export default new UploadService();
