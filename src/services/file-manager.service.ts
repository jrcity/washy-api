/**
 * FileManager Service
 * Business logic for file management operations
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import FileManager, { IFileManager } from '@/models/file-manager.model';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary.util';
import { AppError } from '@/utils/error.util';
import { EFILE_FOLDER, EUPLOAD_CATEGORY } from '@/constants/enums.constant';

interface UploadFileInput {
    file: Express.Multer.File;
    folder: EFILE_FOLDER;
    uploadedBy: string;
    tags?: string[];
    relatedModel?: string;
    relatedId?: string;
    description?: string;
    metadata?: Record<string, any>;
}

interface FileFilters {
    folder?: EFILE_FOLDER;
    uploadedBy?: string;
    relatedModel?: string;
    relatedId?: string;
    tags?: string[];
    mimeType?: string;
    isArchived?: boolean;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    sort?: string;
}

// Map EFILE_FOLDER to EUPLOAD_CATEGORY for cloudinary
const folderToCategoryMap: Record<EFILE_FOLDER, EUPLOAD_CATEGORY> = {
    [EFILE_FOLDER.RECEIPTS]: EUPLOAD_CATEGORY.OTHER,
    [EFILE_FOLDER.SERVICE_IMAGES]: EUPLOAD_CATEGORY.SERVICE_IMAGE,
    [EFILE_FOLDER.ORDER_PROOFS]: EUPLOAD_CATEGORY.PROOF_PHOTO,
    [EFILE_FOLDER.PROFILE_PHOTOS]: EUPLOAD_CATEGORY.OTHER,
    [EFILE_FOLDER.DOCUMENTS]: EUPLOAD_CATEGORY.OTHER,
    [EFILE_FOLDER.BRANCH_IMAGES]: EUPLOAD_CATEGORY.OTHER,
    [EFILE_FOLDER.CATEGORY_IMAGES]: EUPLOAD_CATEGORY.CATEGORY_IMAGE,
    [EFILE_FOLDER.CHAT_ATTACHMENTS]: EUPLOAD_CATEGORY.OTHER,
    [EFILE_FOLDER.OTHER]: EUPLOAD_CATEGORY.OTHER
};

class FileManagerService {
    /**
     * Upload a file to Cloudinary and save metadata
     */
    async uploadFile(input: UploadFileInput): Promise<IFileManager> {
        // Map folder to category for cloudinary
        const category = folderToCategoryMap[input.folder] || EUPLOAD_CATEGORY.OTHER;

        // Upload to Cloudinary
        const result = await uploadToCloudinary(
            input.file.buffer,
            input.file.originalname,
            category
        );

        // Create file record
        const fileRecord = await FileManager.create({
            url: result.url,
            publicId: result.publicId,
            folder: input.folder,
            originalName: input.file.originalname,
            mimeType: input.file.mimetype,
            size: input.file.size,
            dimensions: result.width && result.height ? {
                width: result.width,
                height: result.height
            } : undefined,
            uploadedBy: input.uploadedBy,
            tags: input.tags || [],
            relatedModel: input.relatedModel as any,
            relatedId: input.relatedId ? new Types.ObjectId(input.relatedId) : undefined,
            description: input.description,
            metadata: input.metadata
        });

        return fileRecord;
    }

    /**
     * Upload multiple files
     */
    async uploadMultiple(files: Express.Multer.File[], commonInput: Omit<UploadFileInput, 'file'>): Promise<IFileManager[]> {
        const uploadPromises = files.map(file =>
            this.uploadFile({ ...commonInput, file })
        );
        return Promise.all(uploadPromises);
    }

    /**
     * Get files with filters and pagination
     */
    async getFiles(filters: FileFilters) {
        const query: any = {};

        if (filters.folder) query.folder = filters.folder;
        if (filters.uploadedBy) query.uploadedBy = new Types.ObjectId(filters.uploadedBy);
        if (filters.relatedModel) query.relatedModel = filters.relatedModel;
        if (filters.relatedId) query.relatedId = new Types.ObjectId(filters.relatedId);
        if (filters.mimeType) query.mimeType = { $regex: filters.mimeType, $options: 'i' };
        if (filters.isArchived !== undefined) query.isArchived = filters.isArchived;
        if (filters.tags?.length) query.tags = { $in: filters.tags };

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) query.createdAt.$gte = filters.startDate;
            if (filters.endDate) query.createdAt.$lte = filters.endDate;
        }

        if (filters.search) {
            query.$text = { $search: filters.search };
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const sort = filters.sort || '-createdAt';

        const [files, total] = await Promise.all([
            FileManager.find(query)
                .populate('uploadedBy', 'name email')
                .populate('archivedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            FileManager.countDocuments(query)
        ]);

        return {
            files,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get file by ID
     */
    async getFileById(fileId: string): Promise<IFileManager> {
        const file = await FileManager.findById(fileId)
            .populate('uploadedBy', 'name email')
            .populate('archivedBy', 'name');

        if (!file) {
            throw AppError.notFound('File not found');
        }

        return file;
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        const stats = await FileManager.aggregate([
            { $match: { isArchived: false } },
            {
                $group: {
                    _id: '$folder',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            },
            { $sort: { totalSize: -1 } }
        ]);

        const totalStats = await FileManager.aggregate([
            { $match: { isArchived: false } },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalBytes: { $sum: '$size' }
                }
            }
        ]);

        const byMimeType = await FileManager.aggregate([
            { $match: { isArchived: false } },
            {
                $group: {
                    _id: { $substr: ['$mimeType', 0, { $indexOfBytes: ['$mimeType', '/'] }] },
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ]);

        return {
            byFolder: stats,
            byType: byMimeType,
            total: totalStats[0] || { totalFiles: 0, totalBytes: 0 }
        };
    }

    /**
     * Update file tags
     */
    async updateFileTags(fileId: string, tags: string[]): Promise<IFileManager> {
        const file = await FileManager.findByIdAndUpdate(
            fileId,
            { tags: tags.map(t => t.toLowerCase().trim()) },
            { new: true }
        );

        if (!file) {
            throw AppError.notFound('File not found');
        }

        return file;
    }

    /**
     * Move file to different folder
     */
    async moveToFolder(fileId: string, newFolder: EFILE_FOLDER): Promise<IFileManager> {
        const file = await FileManager.findByIdAndUpdate(
            fileId,
            { folder: newFolder },
            { new: true }
        );

        if (!file) {
            throw AppError.notFound('File not found');
        }

        return file;
    }

    /**
     * Archive a file
     */
    async archiveFile(fileId: string, archivedBy: string): Promise<IFileManager> {
        const file = await FileManager.findById(fileId);

        if (!file) {
            throw AppError.notFound('File not found');
        }

        if (file.isArchived) {
            throw AppError.badRequest('File is already archived');
        }

        file.isArchived = true;
        file.archivedAt = new Date();
        file.archivedBy = new Types.ObjectId(archivedBy);
        await file.save();

        return file;
    }

    /**
     * Bulk archive files
     */
    async bulkArchive(fileIds: string[], archivedBy: string): Promise<number> {
        const result = await FileManager.updateMany(
            {
                _id: { $in: fileIds.map(id => new Types.ObjectId(id)) },
                isArchived: false
            },
            {
                isArchived: true,
                archivedAt: new Date(),
                archivedBy: new Types.ObjectId(archivedBy)
            }
        );

        return result.modifiedCount;
    }

    /**
     * Restore an archived file
     */
    async restoreFile(fileId: string): Promise<IFileManager> {
        const file = await FileManager.findById(fileId);

        if (!file) {
            throw AppError.notFound('File not found');
        }

        if (!file.isArchived) {
            throw AppError.badRequest('File is not archived');
        }

        file.isArchived = false;
        file.archivedAt = undefined;
        file.archivedBy = undefined;
        await file.save();

        return file;
    }

    /**
     * Permanently delete a file (super admin only)
     */
    async deleteFile(fileId: string): Promise<void> {
        const file = await FileManager.findById(fileId);

        if (!file) {
            throw AppError.notFound('File not found');
        }

        // Delete from Cloudinary
        try {
            await deleteFromCloudinary(file.publicId);
        } catch (error) {
            console.error('Cloudinary delete error:', error);
        }

        // Delete from database
        await FileManager.findByIdAndDelete(fileId);
    }

    /**
     * Update file relation
     */
    async updateRelation(
        fileId: string,
        relatedModel: string,
        relatedId: string
    ): Promise<IFileManager> {
        const file = await FileManager.findByIdAndUpdate(
            fileId,
            {
                relatedModel: relatedModel as any,
                relatedId: new Types.ObjectId(relatedId)
            },
            { new: true }
        );

        if (!file) {
            throw AppError.notFound('File not found');
        }

        return file;
    }

    /**
     * Get files related to a specific entity
     */
    async getRelatedFiles(
        relatedModel: string,
        relatedId: string,
        includeArchived = false
    ): Promise<IFileManager[]> {
        const query: any = {
            relatedModel,
            relatedId: new Types.ObjectId(relatedId)
        };

        if (!includeArchived) {
            query.isArchived = false;
        }

        return FileManager.find(query).sort('-createdAt');
    }
}

export default new FileManagerService();
