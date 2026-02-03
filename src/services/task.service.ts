/**
 * Task Service
 * Business logic for task assignment and management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Task, { ITask } from '@/models/task.model';
import Order from '@/models/order.model';
import User from '@/models/user.model';
import { AppError } from '@/utils/error.util';
import { ETASK_TYPE, ETASK_STATUS, ETASK_PRIORITY, EORDER_STATUS, EUSERS_ROLE } from '@/constants/enums.constant';

interface CreateTaskInput {
    orderId: string;
    type: ETASK_TYPE;
    scheduledFor: Date;
    priority?: ETASK_PRIORITY;
    notes?: string;
    address: {
        street: string;
        area: string;
        city: string;
        state?: string;
        coordinates?: { lat: number; lng: number };
    };
}

interface TaskFilters {
    branch?: string;
    assignedTo?: string;
    status?: ETASK_STATUS;
    type?: ETASK_TYPE;
    priority?: ETASK_PRIORITY;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

class TaskService {
    /**
     * Create a task for an order
     */
    async createTask(input: CreateTaskInput): Promise<ITask> {
        const order = await Order.findById(input.orderId);
        if (!order) {
            throw AppError.notFound('Order not found');
        }

        // Check if task already exists for this order and type
        const existingTask = await Task.findOne({
            order: input.orderId,
            type: input.type
        });

        if (existingTask) {
            throw AppError.badRequest(`${input.type} task already exists for this order`);
        }

        const task = await Task.create({
            order: input.orderId,
            type: input.type,
            branch: order.branch,
            scheduledFor: input.scheduledFor,
            priority: input.priority || ETASK_PRIORITY.NORMAL,
            notes: input.notes,
            address: {
                ...input.address,
                state: input.address.state || 'Lagos'
            }
        });

        return task;
    }
    /**
     * Upsert a task from an order assignment
     */
    async upsertTaskFromOrder(orderId: string, type: ETASK_TYPE, riderId: string, assignedBy: string): Promise<ITask> {
        const order = await Order.findById(orderId);
        if (!order) {
            throw AppError.notFound('Order not found');
        }

        const address = type === ETASK_TYPE.PICKUP ? order.pickupAddress : order.deliveryAddress;
        const scheduledFor = type === ETASK_TYPE.PICKUP ? order.pickupDate : (order.expectedDeliveryDate || new Date());

        // Use findOneAndUpdate with upsert for atomic operation or manual check
        let task = await Task.findOne({
            order: new Types.ObjectId(orderId),
            type: type
        });

        if (task) {
            task.assignedTo = new Types.ObjectId(riderId);
            task.assignedBy = new Types.ObjectId(assignedBy);
            task.status = ETASK_STATUS.ASSIGNED;
            // Update address and timing just in case they changed
            task.address = {
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state || 'Lagos'
            };
            task.scheduledFor = scheduledFor;
            await task.save();
        } else {
            task = await Task.create({
                order: new Types.ObjectId(orderId),
                type: type,
                branch: order.branch,
                assignedTo: new Types.ObjectId(riderId),
                assignedBy: new Types.ObjectId(assignedBy),
                status: ETASK_STATUS.ASSIGNED,
                priority: ETASK_PRIORITY.NORMAL,
                scheduledFor: scheduledFor,
                address: {
                    street: address.street,
                    area: address.area,
                    city: address.city,
                    state: address.state || 'Lagos'
                }
            });
        }

        return task;
    }

    /**
     * Get tasks with filters
     */
    async getTasks(filters: TaskFilters) {
        const query: any = {};

        if (filters.branch) query.branch = new Types.ObjectId(filters.branch);
        if (filters.assignedTo) query.assignedTo = new Types.ObjectId(filters.assignedTo);
        if (filters.status) query.status = filters.status;
        if (filters.type) query.type = filters.type;
        if (filters.priority) query.priority = filters.priority;

        if (filters.startDate || filters.endDate) {
            query.scheduledFor = {};
            if (filters.startDate) query.scheduledFor.$gte = filters.startDate;
            if (filters.endDate) query.scheduledFor.$lte = filters.endDate;
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            Task.find(query)
                .populate('order', 'orderNumber customer total status')
                .populate('assignedTo', 'name phone')
                .populate('assignedBy', 'name')
                .populate('branch', 'name code')
                .sort({ priority: -1, scheduledFor: 1 })
                .skip(skip)
                .limit(limit),
            Task.countDocuments(query)
        ]);

        return {
            tasks,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    }

    /**
     * Get unassigned tasks for a branch
     */
    async getUnassignedTasks(branchId: string) {
        return Task.find({
            branch: new Types.ObjectId(branchId),
            status: ETASK_STATUS.PENDING,
            assignedTo: { $exists: false }
        })
            .populate('order', 'orderNumber customer total')
            .sort({ priority: -1, scheduledFor: 1 });
    }

    /**
     * Get available riders for a branch
     */
    async getAvailableRiders(branchId: string) {
        const riders = await User.find({
            role: EUSERS_ROLE.RIDER,
            isActive: true,
            'assignedBranch': new Types.ObjectId(branchId)
        }).select('name phone isAvailable isOnDuty currentTaskCount maxConcurrentTasks metrics');

        // Get current task counts
        const riderIds = riders.map(r => r._id);
        const taskCounts = await Task.aggregate([
            {
                $match: {
                    assignedTo: { $in: riderIds },
                    status: { $in: [ETASK_STATUS.ASSIGNED, ETASK_STATUS.IN_PROGRESS] }
                }
            },
            {
                $group: {
                    _id: '$assignedTo',
                    activeTaskCount: { $sum: 1 }
                }
            }
        ]);

        const countMap = new Map(taskCounts.map(t => [t._id.toString(), t.activeTaskCount]));

        return riders.map(rider => ({
            ...rider.toObject(),
            activeTaskCount: countMap.get(rider._id.toString()) || 0
        })).filter(r => (r as any).isOnDuty && (r as any).isAvailable);
    }

    /**
     * Assign task to rider
     */
    async assignTask(taskId: string, riderId: string, assignedBy: string): Promise<ITask> {
        const task = await Task.findById(taskId);
        if (!task) {
            throw AppError.notFound('Task not found');
        }

        if (task.status !== ETASK_STATUS.PENDING) {
            throw AppError.badRequest('Task is not available for assignment');
        }

        // Verify rider exists and is available
        const rider = await User.findOne({
            _id: riderId,
            role: EUSERS_ROLE.RIDER,
            isActive: true
        });

        if (!rider) {
            throw AppError.notFound('Rider not found or unavailable');
        }

        // Update task
        task.assignedTo = new Types.ObjectId(riderId);
        task.assignedBy = new Types.ObjectId(assignedBy);
        task.status = ETASK_STATUS.ASSIGNED;
        await task.save();

        // Update order with rider assignment
        const order = await Order.findById(task.order);
        if (order) {
            if (task.type === ETASK_TYPE.PICKUP) {
                order.pickupRider = new Types.ObjectId(riderId);
                if (order.status === EORDER_STATUS.PENDING) {
                    order.status = EORDER_STATUS.CONFIRMED;
                }
            } else {
                order.deliveryRider = new Types.ObjectId(riderId);
            }
            await order.save();
        }

        return task;
    }

    /**
     * Revoke task from rider
     */
    async revokeTask(taskId: string, revokedBy: string, reason: string): Promise<ITask> {
        const task = await Task.findById(taskId);
        if (!task) {
            throw AppError.notFound('Task not found');
        }

        if (task.status === ETASK_STATUS.COMPLETED || task.status === ETASK_STATUS.CANCELLED) {
            throw AppError.badRequest('Cannot revoke completed or cancelled task');
        }

        task.revokedAt = new Date();
        task.revokedBy = new Types.ObjectId(revokedBy);
        task.revocationReason = reason;
        task.status = ETASK_STATUS.PENDING;
        task.assignedTo = undefined;
        await task.save();

        // Update order to remove rider assignment
        const order = await Order.findById(task.order);
        if (order) {
            if (task.type === ETASK_TYPE.PICKUP) {
                order.pickupRider = undefined;
            } else {
                order.deliveryRider = undefined;
            }
            await order.save();
        }

        return task;
    }

    /**
     * Start task (rider action)
     */
    async startTask(taskId: string, riderId: string): Promise<ITask> {
        const task = await Task.findById(taskId);
        if (!task) {
            throw AppError.notFound('Task not found');
        }

        if (!task.assignedTo || task.assignedTo.toString() !== riderId) {
            throw AppError.forbidden('You are not assigned to this task');
        }

        if (task.status !== ETASK_STATUS.ASSIGNED) {
            throw AppError.badRequest('Task cannot be started');
        }

        task.status = ETASK_STATUS.IN_PROGRESS;
        task.startedAt = new Date();
        await task.save();

        return task;
    }

    /**
     * Complete task (rider action)
     */
    async completeTask(taskId: string, riderId: string): Promise<ITask> {
        const task = await Task.findById(taskId);
        if (!task) {
            throw AppError.notFound('Task not found');
        }

        if (!task.assignedTo || task.assignedTo.toString() !== riderId) {
            throw AppError.forbidden('You are not assigned to this task');
        }

        if (task.status !== ETASK_STATUS.IN_PROGRESS) {
            throw AppError.badRequest('Task must be in progress to complete');
        }

        task.status = ETASK_STATUS.COMPLETED;
        task.completedAt = new Date();
        if (task.startedAt) {
            task.actualDuration = Math.round((task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60));
        }
        await task.save();

        // Update order status
        const order = await Order.findById(task.order);
        if (order) {
            if (task.type === ETASK_TYPE.PICKUP) {
                order.status = EORDER_STATUS.PICKED_UP;
            } else if (task.type === ETASK_TYPE.DELIVERY) {
                order.status = EORDER_STATUS.DELIVERED;
            }
            await order.save();
        }

        return task;
    }

    /**
     * Get rider's tasks
     */
    async getRiderTasks(riderId: string, status?: ETASK_STATUS) {
        const query: any = { assignedTo: new Types.ObjectId(riderId) };
        if (status) query.status = status;

        return Task.find(query)
            .populate('order', 'orderNumber customer total status pickupAddress deliveryAddress')
            .populate('branch', 'name code')
            .sort({ status: 1, priority: -1, scheduledFor: 1 });
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId: string): Promise<ITask> {
        const task = await Task.findById(taskId)
            .populate('order')
            .populate('assignedTo', 'name phone')
            .populate('assignedBy', 'name')
            .populate('revokedBy', 'name')
            .populate('branch', 'name code');

        if (!task) {
            throw AppError.notFound('Task not found');
        }

        return task;
    }
}

export default new TaskService();
