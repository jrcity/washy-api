/**
 * Branch Manager Model (User Discriminator)
 * Branch managers with elevated permissions
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Schema, Types } from 'mongoose';
import User, { IUser } from './user.model';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

export interface IBranchManager extends IUser {
  role: EUSERS_ROLE.BRANCH_MANAGER;
  managedBranch?: Types.ObjectId;
  permissions: EPERMISSIONS[];
  targets?: {
    monthlyOrderTarget: number;
    monthlyRevenueTarget: number;
  };
  compensation?: {
    baseSalary: number;
    commissionRate: number;
    bonusStructure?: string;
  };
}

const BranchManagerSchema = new Schema({
  managedBranch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  permissions: [{
    type: String,
    enum: Object.values(EPERMISSIONS),
    default: [
      EPERMISSIONS.CREATE_ORDER,
      EPERMISSIONS.VIEW_ORDERS,
      EPERMISSIONS.UPDATE_ORDER_STATUS,
      EPERMISSIONS.MANAGE_CUSTOMERS,
      EPERMISSIONS.MANAGE_STAFF,
      EPERMISSIONS.VIEW_REPORTS,
      EPERMISSIONS.MANAGE_PICKUP_DELIVERY,
      EPERMISSIONS.SEND_NOTIFICATIONS
    ]
  }],
  targets: {
    monthlyOrderTarget: { type: Number, default: 500 },
    monthlyRevenueTarget: { type: Number, default: 500000 }
  },
  compensation: {
    baseSalary: Number,
    commissionRate: { type: Number, default: 5 },
    bonusStructure: String
  }
});

BranchManagerSchema.index({ managedBranch: 1 });

const BranchManager = User.discriminator<IBranchManager>('BranchManager', BranchManagerSchema);

export default BranchManager;
