/**
 * Service Model
 * Dynamic pricing for different garment and service types
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ESERVICE_CATEGORY, ESERVICE_TYPE, EGARMENT_TYPE } from '@/constants/enums.constant';

// Pricing tier for different garment types
export interface IServicePricing {
  garmentType: EGARMENT_TYPE;
  basePrice: number;           // Base price in Naira
  expressMultiplier: number;   // Multiplier for express service (e.g., 1.5 = 50% extra)
}

export interface IService extends Document {
  name: string;                            // e.g., "Wash & Fold", "Dry Cleaning"
  slug: string;                            // URL-friendly slug
  description: string;
  category: ESERVICE_CATEGORY;             // Laundry, Graphics Design, etc.
  serviceType: ESERVICE_TYPE;              // Wash & Fold, Dry Clean, etc.
  pricing: IServicePricing[];              // Pricing per garment type
  estimatedDuration: {
    standard: number;                      // Hours for standard service
    express: number;                       // Hours for express service
  };
  isExpressAvailable: boolean;
  branch?: Types.ObjectId;                 // If service is branch-specific
  isActive: boolean;
  icon?: string;                           // Icon URL for frontend display
  imageUrl?: string;                       // Service display image (Cloudinary)
  imagePublicId?: string;                  // Cloudinary public ID for deletion
  sortOrder: number;                       // For display ordering
}

const servicePricingSchema = new Schema<IServicePricing>({
  garmentType: {
    type: String,
    enum: Object.values(EGARMENT_TYPE),
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  expressMultiplier: {
    type: Number,
    default: 1.5,
    min: [1, 'Express multiplier must be at least 1']
  }
}, { _id: false });

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(ESERVICE_CATEGORY),
    default: ESERVICE_CATEGORY.LAUNDRY
  },
  serviceType: {
    type: String,
    enum: Object.values(ESERVICE_TYPE),
    required: true
  },
  pricing: [servicePricingSchema],
  estimatedDuration: {
    standard: { type: Number, default: 48 },  // 48 hours default
    express: { type: Number, default: 24 }    // 24 hours for express
  },
  isExpressAvailable: {
    type: Boolean,
    default: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: String,
  imageUrl: String,
  imagePublicId: String,
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying (slug already indexed via unique: true)
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ serviceType: 1 });

// Pre-save hook to generate slug
serviceSchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Method to calculate price for a garment
serviceSchema.methods.calculatePrice = function(
  garmentType: EGARMENT_TYPE, 
  quantity: number, 
  isExpress: boolean
): number {
  const pricingItem = this.pricing.find(
    (p: IServicePricing) => p.garmentType === garmentType
  );
  
  if (!pricingItem) {
    throw new Error(`Pricing not available for garment type: ${garmentType}`);
  }
  
  let price = pricingItem.basePrice * quantity;
  if (isExpress && this.isExpressAvailable) {
    price *= pricingItem.expressMultiplier;
  }
  
  return price;
};

// Static method to get all active services with pricing
serviceSchema.statics.getActiveServices = function(category?: ESERVICE_CATEGORY) {
  const query: any = { isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

export const Service = mongoose.model<IService>('Service', serviceSchema);
export default Service;
