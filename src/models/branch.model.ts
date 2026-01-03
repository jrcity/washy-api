/**
 * Branch Model
 * Multi-branch management for Washy
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICoverageZone {
  name: string;          // e.g., "Surulere", "Yaba", "Ikeja"
  state: string;         // e.g., "Lagos"
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IBranch extends Document {
  name: string;                          // e.g., "Ikeja Branch", "Lekki Branch"
  code: string;                          // Unique branch code e.g., "IKJ-001"
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
  coverageZones: ICoverageZone[];        // Zones this branch covers for zone-based assignment
  manager: Types.ObjectId;               // Reference to User (Branch Manager)
  staff: Types.ObjectId[];               // Staff assigned to this branch
  riders: Types.ObjectId[];              // Riders assigned to this branch
  contactPhone: string;
  contactEmail: string;
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  isActive: boolean;
  capacity: {
    dailyOrderLimit: number;
    currentDailyOrders: number;
  };
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  };
}

const coverageZoneSchema = new Schema<ICoverageZone>({
  name: { type: String, required: true },
  state: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { _id: false });

const operatingHoursSchema = {
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' },
  isOpen: { type: Boolean, default: true }
};

const branchSchema = new Schema<IBranch>({
  name: { 
    type: String, 
    required: [true, 'Branch name is required'],
    trim: true 
  },
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true 
  },
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true, default: 'Lagos' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  coverageZones: [coverageZoneSchema],
  manager: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  staff: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  riders: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  contactPhone: { 
    type: String, 
    required: [true, 'Contact phone is required'] 
  },
  contactEmail: { 
    type: String, 
    required: [true, 'Contact email is required'],
    lowercase: true 
  },
  operatingHours: {
    monday: operatingHoursSchema,
    tuesday: operatingHoursSchema,
    wednesday: operatingHoursSchema,
    thursday: operatingHoursSchema,
    friday: operatingHoursSchema,
    saturday: { ...operatingHoursSchema, close: { type: String, default: '16:00' } },
    sunday: { ...operatingHoursSchema, isOpen: { type: Boolean, default: false } }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  capacity: {
    dailyOrderLimit: { type: Number, default: 100 },
    currentDailyOrders: { type: Number, default: 0 }
  },
  metrics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
branchSchema.index({ 'coverageZones.name': 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ 'address.state': 1, 'address.city': 1 });

// Static method to find branch by coverage zone
branchSchema.statics.findByZone = function(zoneName: string, state: string = 'Lagos') {
  return this.findOne({
    isActive: true,
    coverageZones: {
      $elemMatch: {
        name: { $regex: new RegExp(zoneName, 'i') },
        state: { $regex: new RegExp(state, 'i') }
      }
    }
  });
};

// Method to check if branch is open
branchSchema.methods.isOpenNow = function(): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const hours = this.operatingHours[dayName];
  if (!hours.isOpen) return false;
  
  return currentTime >= hours.open && currentTime <= hours.close;
};

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
export default Branch;