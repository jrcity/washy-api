/**
 * Rider Model (User Discriminator)
 * Logistics personnel for pickup and delivery
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Types } from 'mongoose';
import User, { IUser } from './user.model';
import { EUSERS_ROLE } from '@/constants/enums.constant';

export interface IRider extends IUser {
  role: EUSERS_ROLE.RIDER;
  
  // Branch assignment
  assignedBranch: Types.ObjectId;
  
  // Coverage zones the rider handles
  coverageZones: string[];
  
  // Vehicle info
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'van';
  vehiclePlateNumber?: string;
  
  // Availability
  isAvailable: boolean;
  isOnDuty: boolean;
  
  // Current location (for real-time tracking)
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  
  // Performance metrics
  metrics: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    averageRating: number;
    totalRatings: number;
  };
  
  // Bank details for payment
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  
  // Identity verification
  identityVerification?: {
    ninNumber?: string;
    driversLicense?: string;
    isVerified: boolean;
    verifiedAt?: Date;
  };
}

const RiderSchema = new Schema({
  assignedBranch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Assigned branch is required']
  },
  coverageZones: [{
    type: String,
    trim: true
  }],
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car', 'van'],
    default: 'motorcycle'
  },
  vehiclePlateNumber: {
    type: String,
    uppercase: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOnDuty: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: { type: Date, default: Date.now }
  },
  metrics: {
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  identityVerification: {
    ninNumber: String,
    driversLicense: String,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date
  }
});

// Index for finding available riders by branch
RiderSchema.index({ assignedBranch: 1, isAvailable: 1, isOnDuty: 1 });
RiderSchema.index({ coverageZones: 1 });

// Method to update location
RiderSchema.methods.updateLocation = function(lat: number, lng: number) {
  this.currentLocation = {
    lat,
    lng,
    updatedAt: new Date()
  };
  return this.save();
};

// Method to go on/off duty
RiderSchema.methods.toggleDuty = function(isOnDuty: boolean) {
  this.isOnDuty = isOnDuty;
  this.isAvailable = isOnDuty; // When off duty, not available
  return this.save();
};

// Method to update rating
RiderSchema.methods.addRating = function(rating: number) {
  const totalRatings = this.metrics.totalRatings + 1;
  const newAverage = (
    (this.metrics.averageRating * this.metrics.totalRatings) + rating
  ) / totalRatings;
  
  this.metrics.averageRating = Math.round(newAverage * 10) / 10;
  this.metrics.totalRatings = totalRatings;
  return this.save();
};

const Rider = User.discriminator<IRider>('Rider', RiderSchema);

export default Rider;
