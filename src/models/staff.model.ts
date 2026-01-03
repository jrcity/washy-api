/**
 * Staff Model (User Discriminator)
 * Branch staff for processing orders
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Schema, Types } from 'mongoose';
import User, { IUser } from './user.model';
import { EUSERS_ROLE, EPERMISSIONS } from '@/constants/enums.constant';

export interface IStaff extends IUser {
  role: EUSERS_ROLE.STAFF;
  assignedBranch?: Types.ObjectId;
  permissions: EPERMISSIONS[];
  workSchedule?: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  jobTitle?: string;
  employmentDetails?: {
    employeeId: string;
    hiredAt: Date;
    salary?: number;
    isContractor: boolean;
  };
  metrics: {
    ordersProcessed: number;
    averageProcessingTime: number;
  };
}

const workDaySchema = {
  start: { type: String, default: '08:00' },
  end: { type: String, default: '18:00' },
  isWorking: { type: Boolean, default: true }
};

const StaffSchema = new Schema({
  assignedBranch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  permissions: {
    type: [String],
    enum: Object.values(EPERMISSIONS),
    default: [
      EPERMISSIONS.CREATE_ORDER,
      EPERMISSIONS.VIEW_ORDERS,
      EPERMISSIONS.UPDATE_ORDER_STATUS
    ]
  },
  workSchedule: {
    monday: workDaySchema,
    tuesday: workDaySchema,
    wednesday: workDaySchema,
    thursday: workDaySchema,
    friday: workDaySchema,
    saturday: { ...workDaySchema, end: { type: String, default: '16:00' } },
    sunday: { ...workDaySchema, isWorking: { type: Boolean, default: false } }
  },
  jobTitle: {
    type: String,
    default: 'Laundry Staff'
  },
  employmentDetails: {
    employeeId: String,
    hiredAt: { type: Date, default: Date.now },
    salary: Number,
    isContractor: { type: Boolean, default: false }
  },
  metrics: {
    ordersProcessed: { type: Number, default: 0 },
    averageProcessingTime: { type: Number, default: 0 }
  }
});

StaffSchema.index({ assignedBranch: 1 });

const Staff = User.discriminator<IStaff>('Staff', StaffSchema);

export default Staff;
