/**
 * Task Model
 * Rider task assignments for pickup and delivery
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ETASK_TYPE, ETASK_STATUS, ETASK_PRIORITY } from '@/constants/enums.constant';

export interface ITask extends Document {
    order: Types.ObjectId;
    type: ETASK_TYPE;
    assignedTo?: Types.ObjectId;
    assignedBy?: Types.ObjectId;
    status: ETASK_STATUS;
    priority: ETASK_PRIORITY;
    branch: Types.ObjectId;
    scheduledFor: Date;
    estimatedDuration?: number;  // minutes
    actualDuration?: number;
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
    revokedAt?: Date;
    revokedBy?: Types.ObjectId;
    revocationReason?: string;
    address: {
        street: string;
        area: string;
        city: string;
        state: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}

const taskSchema = new Schema<ITask>({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order is required']
    },
    type: {
        type: String,
        enum: Object.values(ETASK_TYPE),
        required: [true, 'Task type is required']
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: Object.values(ETASK_STATUS),
        default: ETASK_STATUS.PENDING
    },
    priority: {
        type: String,
        enum: Object.values(ETASK_PRIORITY),
        default: ETASK_PRIORITY.NORMAL
    },
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch is required']
    },
    scheduledFor: {
        type: Date,
        required: [true, 'Scheduled time is required']
    },
    estimatedDuration: Number,
    actualDuration: Number,
    startedAt: Date,
    completedAt: Date,
    notes: String,
    revokedAt: Date,
    revokedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    revocationReason: String,
    address: {
        street: { type: String, required: true },
        area: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: 'Lagos' },
        coordinates: {
            lat: Number,
            lng: Number
        }
    }
}, {
    timestamps: true
});

// Indexes
taskSchema.index({ order: 1, type: 1 }, { unique: true }); // One task per type per order
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ branch: 1, status: 1, scheduledFor: 1 });
taskSchema.index({ status: 1, priority: -1, scheduledFor: 1 });

// Method to assign task to rider
taskSchema.methods.assign = function (riderId: Types.ObjectId, assignedBy: Types.ObjectId) {
    this.assignedTo = riderId;
    this.assignedBy = assignedBy;
    this.status = ETASK_STATUS.ASSIGNED;
    return this.save();
};

// Method to revoke task
taskSchema.methods.revoke = function (revokedBy: Types.ObjectId, reason: string) {
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason;
    this.status = ETASK_STATUS.PENDING;
    this.assignedTo = undefined;
    return this.save();
};

// Method to start task
taskSchema.methods.start = function () {
    this.status = ETASK_STATUS.IN_PROGRESS;
    this.startedAt = new Date();
    return this.save();
};

// Method to complete task
taskSchema.methods.complete = function () {
    this.status = ETASK_STATUS.COMPLETED;
    this.completedAt = new Date();
    if (this.startedAt) {
        this.actualDuration = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
    }
    return this.save();
};

export const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task;
