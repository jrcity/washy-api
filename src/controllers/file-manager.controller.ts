/**
 * FileManager Controller
 * HTTP handlers for file management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response } from 'express';
import fileManagerService from '@/services/file-manager.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { EFILE_FOLDER } from '@/constants/enums.constant';

class FileManagerController {
    /**
     * Upload a file
     */
    uploadFile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            return ResponseHandler.badRequest(res, 'No file provided');
        }

        const file = await fileManagerService.uploadFile({
            file: req.file,
            folder: req.body.folder as EFILE_FOLDER,
            uploadedBy: req.user!._id.toString(),
            tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [],
            relatedModel: req.body.relatedModel,
            relatedId: req.body.relatedId,
            description: req.body.description,
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined
        });

        return ResponseHandler.created(res, file, 'File uploaded successfully');
    });

    /**
     * Upload multiple files
     */
    uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return ResponseHandler.badRequest(res, 'No files provided');
        }

        const files = await fileManagerService.uploadMultiple(req.files, {
            folder: req.body.folder as EFILE_FOLDER,
            uploadedBy: req.user!._id.toString(),
            tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [],
            relatedModel: req.body.relatedModel,
            relatedId: req.body.relatedId
        });

        return ResponseHandler.created(res, files, `${files.length} files uploaded successfully`);
    });

    /**
     * Get files with filters
     */
    getFiles = asyncHandler(async (req: Request, res: Response) => {
        const result = await fileManagerService.getFiles({
            folder: req.query.folder as EFILE_FOLDER | undefined,
            uploadedBy: req.query.uploadedBy as string | undefined,
            relatedModel: req.query.relatedModel as string | undefined,
            relatedId: req.query.relatedId as string | undefined,
            tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
            mimeType: req.query.mimeType as string | undefined,
            isArchived: req.query.isArchived === 'true',
            search: req.query.search as string | undefined,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sort: req.query.sort as string | undefined
        });

        return ResponseHandler.success(res, result, 'Files retrieved successfully');
    });

    /**
     * Get single file
     */
    getFile = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.getFileById(req.params.id as string);
        return ResponseHandler.success(res, file, 'File retrieved successfully');
    });

    /**
     * Get storage statistics
     */
    getStorageStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await fileManagerService.getStorageStats();
        return ResponseHandler.success(res, stats, 'Storage stats retrieved successfully');
    });

    /**
     * Update file tags
     */
    updateTags = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.updateFileTags(
            req.params.id as string,
            req.body.tags
        );
        return ResponseHandler.success(res, file, 'Tags updated successfully');
    });

    /**
     * Move file to folder
     */
    moveToFolder = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.moveToFolder(
            req.params.id as string,
            req.body.folder as EFILE_FOLDER
        );
        return ResponseHandler.success(res, file, 'File moved successfully');
    });

    /**
     * Archive file
     */
    archiveFile = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.archiveFile(
            req.params.id as string,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, file, 'File archived successfully');
    });

    /**
     * Bulk archive files
     */
    bulkArchive = asyncHandler(async (req: Request, res: Response) => {
        const count = await fileManagerService.bulkArchive(
            req.body.fileIds,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, { archivedCount: count }, `${count} files archived successfully`);
    });

    /**
     * Restore file
     */
    restoreFile = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.restoreFile(req.params.id as string);
        return ResponseHandler.success(res, file, 'File restored successfully');
    });

    /**
     * Delete file permanently
     */
    deleteFile = asyncHandler(async (req: Request, res: Response) => {
        await fileManagerService.deleteFile(req.params.id as string);
        return ResponseHandler.success(res, null, 'File deleted permanently');
    });

    /**
     * Update file relation
     */
    updateRelation = asyncHandler(async (req: Request, res: Response) => {
        const file = await fileManagerService.updateRelation(
            req.params.id as string,
            req.body.relatedModel,
            req.body.relatedId
        );
        return ResponseHandler.success(res, file, 'File relation updated successfully');
    });

    /**
     * Get files related to entity
     */
    getRelatedFiles = asyncHandler(async (req: Request, res: Response) => {
        const files = await fileManagerService.getRelatedFiles(
            req.params.model as string,
            req.params.modelId as string,
            req.query.includeArchived === 'true'
        );
        return ResponseHandler.success(res, files, 'Related files retrieved successfully');
    });
}

export default new FileManagerController();
