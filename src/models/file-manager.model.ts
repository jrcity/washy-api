/**
 * FileManager Model
 * Extended file management with folders, tags, and admin features
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { EFILE_FOLDER } from '@/constants/enums.constant';

export interface IFileManager extends Document {
    url: string;                              // Cloudinary secure URL
    publicId: string;                         // Cloudinary public ID for deletion
    folder: EFILE_FOLDER;                     // File folder/category
    originalName: string;                     // Original filename
    mimeType: string;                         // File MIME type
    size: number;                             // File size in bytes
    dimensions?: {
        width: number;
        height: number;
    };
    uploadedBy: Types.ObjectId;               // User who uploaded
    tags: string[];                           // Searchable tags
    relatedModel?: 'Service' | 'Category' | 'Order' | 'Branch' | 'Receipt' | 'User';
    relatedId?: Types.ObjectId;               // Related document ID
    isArchived: boolean;                      // Soft archive flag
    archivedAt?: Date;
    archivedBy?: Types.ObjectId;
    metadata?: Record<string, any>;           // Additional metadata
    description?: string;                     // Optional description
}

const fileManagerSchema = new Schema<IFileManager>({
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    publicId: {
        type: String,
        required: [true, 'Public ID is required'],
        unique: true
    },
    folder: {
        type: String,
        enum: Object.values(EFILE_FOLDER),
        required: [true, 'Folder is required'],
        default: EFILE_FOLDER.OTHER
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    dimensions: {
        width: Number,
        height: Number
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    relatedModel: {
        type: String,
        enum: ['Service', 'Category', 'Order', 'Branch', 'Receipt', 'User']
    },
    relatedId: {
        type: Schema.Types.ObjectId
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    archivedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: Schema.Types.Mixed,
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
fileManagerSchema.index({ folder: 1, isArchived: 1, createdAt: -1 });
fileManagerSchema.index({ uploadedBy: 1, createdAt: -1 });
fileManagerSchema.index({ relatedModel: 1, relatedId: 1 });
fileManagerSchema.index({ tags: 1 });
fileManagerSchema.index({ mimeType: 1 });
fileManagerSchema.index({
    originalName: 'text',
    description: 'text',
    tags: 'text'
});

// Archive method
fileManagerSchema.methods.archive = function (archivedBy: Types.ObjectId) {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    return this.save();
};

// Restore method
fileManagerSchema.methods.restore = function () {
    this.isArchived = false;
    this.archivedAt = undefined;
    this.archivedBy = undefined;
    return this.save();
};

// Static method to get storage stats
fileManagerSchema.statics.getStorageStats = async function () {
    const stats = await this.aggregate([
        { $match: { isArchived: false } },
        {
            $group: {
                _id: '$folder',
                count: { $sum: 1 },
                totalSize: { $sum: '$size' }
            }
        }
    ]);

    const total = await this.aggregate([
        { $match: { isArchived: false } },
        {
            $group: {
                _id: null,
                totalFiles: { $sum: 1 },
                totalBytes: { $sum: '$size' }
            }
        }
    ]);

    return {
        byFolder: stats,
        total: total[0] || { totalFiles: 0, totalBytes: 0 }
    };
};

export const FileManager = mongoose.model<IFileManager>('FileManager', fileManagerSchema);
export default FileManager;
