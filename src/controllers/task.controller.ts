/**
 * Task Controller
 * HTTP handlers for task management
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import taskService from '@/services/task.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { ETASK_STATUS, ETASK_TYPE, ETASK_PRIORITY } from '@/constants/enums.constant';

class TaskController {
    /**
     * Create a task
     */
    createTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.createTask({
            orderId: req.body.orderId,
            type: req.body.type,
            scheduledFor: new Date(req.body.scheduledFor),
            priority: req.body.priority,
            notes: req.body.notes,
            address: req.body.address
        });
        return ResponseHandler.created(res, task, 'Task created successfully');
    });

    /**
     * Get tasks with filters
     */
    getTasks = asyncHandler(async (req: Request, res: Response) => {
        const result = await taskService.getTasks({
            branch: req.query.branch as string | undefined,
            assignedTo: req.query.assignedTo as string | undefined,
            status: req.query.status as ETASK_STATUS | undefined,
            type: req.query.type as ETASK_TYPE | undefined,
            priority: req.query.priority as ETASK_PRIORITY | undefined,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20
        });
        return ResponseHandler.success(res, result, 'Tasks retrieved successfully');
    });

    /**
     * Get unassigned tasks
     */
    getUnassignedTasks = asyncHandler(async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string;
        const tasks = await taskService.getUnassignedTasks(branchId);
        return ResponseHandler.success(res, tasks, 'Unassigned tasks retrieved');
    });

    /**
     * Get available riders
     */
    getAvailableRiders = asyncHandler(async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string;
        const riders = await taskService.getAvailableRiders(branchId);
        return ResponseHandler.success(res, riders, 'Available riders retrieved');
    });

    /**
     * Get task by ID
     */
    getTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.getTaskById(req.params.id as string);
        return ResponseHandler.success(res, task, 'Task retrieved successfully');
    });

    /**
     * Assign task to rider
     */
    assignTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.assignTask(
            req.params.id as string,
            req.body.riderId,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, task, 'Task assigned successfully');
    });

    /**
     * Revoke task from rider
     */
    revokeTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.revokeTask(
            req.params.id as string,
            req.user!._id.toString(),
            req.body.reason
        );
        return ResponseHandler.success(res, task, 'Task revoked successfully');
    });

    /**
     * Start task (rider)
     */
    startTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.startTask(
            req.params.id as string,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, task, 'Task started');
    });

    /**
     * Complete task (rider)
     */
    completeTask = asyncHandler(async (req: Request, res: Response) => {
        const task = await taskService.completeTask(
            req.params.id as string,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, task, 'Task completed');
    });

    /**
     * Get rider's tasks
     */
    getMyTasks = asyncHandler(async (req: Request, res: Response) => {
        const status = req.query.status as ETASK_STATUS | undefined;
        const tasks = await taskService.getRiderTasks(req.user!._id.toString(), status);
        return ResponseHandler.success(res, tasks, 'Tasks retrieved');
    });
}

export default new TaskController();
