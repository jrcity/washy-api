import mongoose, { Schema, Document } from 'mongoose';
import { EUSERS_ROLE } from '@/constants/enums.constant';

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string; // Critical for Nigeria
    passwordHash: string;
    role: EUSERS_ROLE;
    branch?: mongoose.Types.ObjectId | string; // Branch affiliation
    pushToken?: string; // For mobile notifications
    tokens: [{
        access_token: string;
        refresh_token: string;
    }];
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(EUSERS_ROLE),
        default: EUSERS_ROLE.CUSTOMER
    },
    branch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch'
    },
    managedBranch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch'
    },
    assignedBranch: {
        type: Schema.Types.ObjectId,
        ref: 'Branch'
    },
    pushToken: { type: String },
    tokens: [{
        access_token: String,
        refresh_token: String
    }]
},
    {
        timestamps: true // Automatically adds createdAt, updatedAt
    });

export default mongoose.model<IUser>('User', UserSchema);