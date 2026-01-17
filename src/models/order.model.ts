/**
 * Order Model
 * Complete order management with status tracking
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { 
  EORDER_STATUS, 
  ESERVICE_TYPE, 
  EGARMENT_TYPE, 
  ESERVICE_CATEGORY,
  EDELIVERY_PROOF_TYPE 
} from '@/constants/enums.constant';

// Individual item in an order
export interface IOrderItem {
  service: Types.ObjectId;
  serviceType: ESERVICE_TYPE;
  garmentType: EGARMENT_TYPE;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  isExpress: boolean;
}

// Status history for tracking
export interface IStatusHistory {
  status: EORDER_STATUS;
  timestamp: Date;
  updatedBy?: Types.ObjectId;
  notes?: string;
}

// Pickup/Delivery address
export interface IAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Delivery proof for rider verification
export interface IDeliveryProof {
  type: EDELIVERY_PROOF_TYPE;
  photoUrl?: string;
  otpCode?: string;
  signature?: string;
  verifiedAt?: Date;
}

export interface IOrder extends Document {
  orderNumber: string;                     // Unique order number (e.g., "CF-20241231-0001")
  customer: Types.ObjectId;
  branch: Types.ObjectId;
  
  // Service category for future-proofing (Laundry vs Graphics Design)
  serviceCategory: ESERVICE_CATEGORY;
  
  // Order items
  items: IOrderItem[];
  
  // Scheduling
  pickupDate: Date;
  pickupTimeSlot: string;                  // e.g., "09:00-12:00"
  expectedDeliveryDate: Date;
  deliveryTimeSlot?: string;
  
  // Addresses
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  
  // Assigned personnel
  pickupRider?: Types.ObjectId;
  deliveryRider?: Types.ObjectId;
  
  // Pricing
  subtotal: number;
  discount: number;
  discountCode?: string;
  deliveryFee: number;
  total: number;
  
  // Status tracking
  status: EORDER_STATUS;
  statusHistory: IStatusHistory[];
  
  // Payment
  isPaid: boolean;
  payment?: Types.ObjectId;
  
  // Delivery verification
  deliveryProof?: IDeliveryProof;
  
  // Customer notes and special instructions
  customerNotes?: string;
  internalNotes?: string;
  
  // Ratings & feedback
  rating?: number;
  feedback?: string;
  
  // For Graphics Design orders (future)
  attachments?: string[];                  // Cloudinary URLs for design briefs
  
  // Pickup/Delivery screenshots
  pickupScreenshots?: string[];            // Cloudinary URLs for pickup proof
  deliveryScreenshots?: string[];          // Cloudinary URLs for delivery proof
  
  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;
}

const orderItemSchema = new Schema<IOrderItem>({
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceType: {
    type: String,
    enum: Object.values(ESERVICE_TYPE),
    required: true
  },
  garmentType: {
    type: String,
    enum: Object.values(EGARMENT_TYPE),
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  isExpress: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const statusHistorySchema = new Schema<IStatusHistory>({
  status: {
    type: String,
    enum: Object.values(EORDER_STATUS),
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, { _id: false });

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: 'Lagos' },
  landmark: String,
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { _id: false });

const deliveryProofSchema = new Schema<IDeliveryProof>({
  type: {
    type: String,
    enum: Object.values(EDELIVERY_PROOF_TYPE),
    required: true
  },
  photoUrl: String,
  otpCode: String,
  signature: String,
  verifiedAt: Date
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  serviceCategory: {
    type: String,
    enum: Object.values(ESERVICE_CATEGORY),
    default: ESERVICE_CATEGORY.LAUNDRY
  },
  items: [orderItemSchema],
  pickupDate: {
    type: Date,
    required: [true, 'Pickup date is required']
  },
  pickupTimeSlot: {
    type: String,
    required: [true, 'Pickup time slot is required']
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  deliveryTimeSlot: String,
  pickupAddress: {
    type: addressSchema,
    required: true
  },
  deliveryAddress: {
    type: addressSchema,
    required: true
  },
  pickupRider: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryRider: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountCode: String,
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(EORDER_STATUS),
    default: EORDER_STATUS.PENDING
  },
  statusHistory: [statusHistorySchema],
  isPaid: {
    type: Boolean,
    default: false
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  deliveryProof: deliveryProofSchema,
  customerNotes: String,
  internalNotes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  attachments: [String],
  pickupScreenshots: [String],
  deliveryScreenshots: [String],
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes (orderNumber already indexed via unique: true)
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ branch: 1, status: 1 });
orderSchema.index({ pickupRider: 1, status: 1 });
orderSchema.index({ deliveryRider: 1, status: 1 });
orderSchema.index({ pickupDate: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function() {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Count today's orders
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await mongoose.model('Order').countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    
    this.orderNumber = `CF-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Add initial status to history
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
});

// Method to update order status
orderSchema.methods.updateStatus = function(
  newStatus: EORDER_STATUS,
  updatedBy?: Types.ObjectId,
  notes?: string
) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    notes
  });
  
  if (newStatus === EORDER_STATUS.CANCELLED) {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce(
    (sum: number, item: IOrderItem) => sum + item.subtotal, 
    0
  );
  this.total = this.subtotal - this.discount + this.deliveryFee;
  return this;
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;

