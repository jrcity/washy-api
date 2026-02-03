/**
 * Audit Log Model
 * Track security-sensitive operations
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { EAUDIT_ACTION } from '@/constants/enums.constant';

export interface IAuditLog extends Document {
    action: EAUDIT_ACTION;
    resource: string;
    resourceId?: Types.ObjectId;
    user?: Types.ObjectId;
    ipAddress: string;
    userAgent?: string;
    details?: Record<string, any>;
    timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        enum: Object.values(EAUDIT_ACTION),
        required: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: Schema.Types.ObjectId
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: String,
    details: Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We use custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
