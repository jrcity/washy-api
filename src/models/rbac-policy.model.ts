/**
 * RBAC Policy Model
 * Row-based access control with condition evaluation
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { EUSERS_ROLE, ERBAC_ACTION, ERBAC_OPERATOR } from '@/constants/enums.constant';

export interface IRBACCondition {
    field: string;
    operator: ERBAC_OPERATOR;
    value: any;
    valueField?: string; // For comparing with user/request fields
}

export interface IRBACPolicy extends Document {
    name: string;
    description?: string;
    resource: string;                        // e.g., 'Order', 'Branch', 'Customer'
    action: ERBAC_ACTION;
    roles: EUSERS_ROLE[];                    // Roles this policy applies to
    conditions: IRBACCondition[];            // Conditions that must be met
    conditionLogic: 'AND' | 'OR';
    isActive: boolean;
    priority: number;                        // Higher priority evaluated first
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const rbacConditionSchema = new Schema<IRBACCondition>({
    field: {
        type: String,
        required: [true, 'Field is required']
    },
    operator: {
        type: String,
        enum: Object.values(ERBAC_OPERATOR),
        required: [true, 'Operator is required']
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },
    valueField: String
}, { _id: false });

const rbacPolicySchema = new Schema<IRBACPolicy>({
    name: {
        type: String,
        required: [true, 'Policy name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    resource: {
        type: String,
        required: [true, 'Resource is required'],
        enum: ['Order', 'Branch', 'Customer', 'Service', 'Payment', 'Rider', 'Staff', 'Task', 'Upload']
    },
    action: {
        type: String,
        enum: Object.values(ERBAC_ACTION),
        required: [true, 'Action is required']
    },
    roles: [{
        type: String,
        enum: Object.values(EUSERS_ROLE)
    }],
    conditions: [rbacConditionSchema],
    conditionLogic: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
rbacPolicySchema.index({ resource: 1, action: 1, isActive: 1 });
rbacPolicySchema.index({ roles: 1 });
rbacPolicySchema.index({ priority: -1 });

// Static method to find applicable policies
rbacPolicySchema.statics.findApplicablePolicies = async function (
    resource: string,
    action: ERBAC_ACTION,
    role: EUSERS_ROLE
) {
    return this.find({
        resource,
        action,
        roles: role,
        isActive: true
    }).sort({ priority: -1 });
};

export const RBACPolicy = mongoose.model<IRBACPolicy>('RBACPolicy', rbacPolicySchema);
export default RBACPolicy;
