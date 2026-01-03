/**
 * Preference Model
 * User preferences for notifications and app behavior
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPreference extends Document {
  user: Types.ObjectId;
  
  // Notification preferences
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    reminders: boolean;
  };
  
  // App preferences
  app: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    currency: string;
  };
  
  // Saved addresses
  savedAddresses: {
    label: string;
    street: string;
    area: string;
    city: string;
    state: string;
    landmark?: string;
    isDefault: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }[];
  
  // Preferred payment method
  preferredPaymentMethod?: string;
  
  // Preferred branch
  preferredBranch?: Types.ObjectId;
  
  // Preferred time slots
  preferredTimeSlots: {
    pickup: string[];
    delivery: string[];
  };
}

const savedAddressSchema = new Schema({
  label: { type: String, required: true },
  street: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: 'Lagos' },
  landmark: String,
  isDefault: { type: Boolean, default: false },
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { _id: true });

const preferenceSchema = new Schema<IPreference>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    reminders: { type: Boolean, default: true }
  },
  app: {
    language: { type: String, default: 'en' },
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'],
      default: 'system' 
    },
    currency: { type: String, default: 'NGN' }
  },
  savedAddresses: [savedAddressSchema],
  preferredPaymentMethod: String,
  preferredBranch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  preferredTimeSlots: {
    pickup: [{ type: String }],
    delivery: [{ type: String }]
  }
}, {
  timestamps: true
});

// Index
preferenceSchema.index({ user: 1 });

// Method to add saved address
preferenceSchema.methods.addAddress = function(address: any) {
  // If this is set as default, unset other defaults
  if (address.isDefault) {
    this.savedAddresses.forEach((addr: any) => {
      addr.isDefault = false;
    });
  }
  
  this.savedAddresses.push(address);
  return this.save();
};

// Method to get default address
preferenceSchema.methods.getDefaultAddress = function() {
  return this.savedAddresses.find((addr: any) => addr.isDefault) || this.savedAddresses[0];
};

export const Preference = mongoose.model<IPreference>('Preference', preferenceSchema);
export default Preference;
