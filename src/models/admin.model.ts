/**
 * Admin Model
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Schema } from 'mongoose';
import User, { IUser } from './user.model';
import { EPERMISSIONS, EUSERS_ROLE } from '@/constants/enums.constant';

export interface IAdmin extends IUser {
  role: EUSERS_ROLE.ADMIN | EUSERS_ROLE.SUPER_ADMIN;
  permissions: string[];
  isSuperAdmin: boolean;
}

const AdminSchema = new Schema({
  permissions: {
    type: [String],
    default: Object.values(EPERMISSIONS),
  },
  isSuperAdmin: {
    type: Boolean,
    default: true,
  },
});

const Admin = User.discriminator<IAdmin>('Admin', AdminSchema);

export default Admin;


