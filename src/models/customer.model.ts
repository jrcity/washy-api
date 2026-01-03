/**
 * Customer Model
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema } from 'mongoose';
import User, { IUser } from './user.model';

export interface ICustomer extends IUser {
  orders: mongoose.Types.ObjectId[];
  payments: mongoose.Types.ObjectId[];
  notifications: {
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  }[];
  address: {
    area: string;
    street: string;
    city: string;
    landmark: string;
    state: string;
    zipCode: string;
  };
  preferences: {
    notificationEnabled: boolean;
  };
}

const CustomerSchema = new Schema({
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  notifications: [{
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  address: {
    area: String,
    street: String,
    city: String,
    landmark: String,
    state: String,
    zipCode: String
  },
  preferences: {
    notificationEnabled: { type: Boolean, default: true }
  }
});

const Customer = User.discriminator<ICustomer>('Customer', CustomerSchema);

export default Customer;

