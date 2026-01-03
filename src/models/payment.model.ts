/**
 * Payment Model
 * Payment tracking with Paystack integration
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { EPAYMENT_STATUS, EPAYMENT_METHOD } from '@/constants/enums.constant';

export interface IPayment extends Document {
  order: Types.ObjectId;
  customer: Types.ObjectId;
  
  // Amount details
  amount: number;                          // Amount in Naira
  amountPaid: number;                      // Actual amount paid
  currency: string;
  
  // Payment method
  method: EPAYMENT_METHOD;
  
  // Status
  status: EPAYMENT_STATUS;
  
  // Paystack integration
  paystackReference: string;               // Unique reference for Paystack
  paystackAccessCode?: string;
  paystackAuthorizationUrl?: string;
  paystackTransactionId?: string;
  
  // Bank transfer details (for manual verification)
  bankTransferDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferReference?: string;
  };
  
  // Refund details
  refund?: {
    amount: number;
    reason: string;
    refundedAt: Date;
    refundReference?: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

const paymentSchema = new Schema<IPayment>({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    uppercase: true
  },
  method: {
    type: String,
    enum: Object.values(EPAYMENT_METHOD),
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: Object.values(EPAYMENT_STATUS),
    default: EPAYMENT_STATUS.PENDING
  },
  paystackReference: {
    type: String,
    unique: true,
    sparse: true
  },
  paystackAccessCode: String,
  paystackAuthorizationUrl: String,
  paystackTransactionId: String,
  bankTransferDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    transferReference: String
  },
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundReference: String
  },
  metadata: Schema.Types.Mixed,
  paidAt: Date,
  failedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

// Indexes (paystackReference already indexed via unique: true)
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save hook to generate Paystack reference
paymentSchema.pre('save', function() {
  if (this.isNew && !this.paystackReference) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paystackReference = `CF_${timestamp}_${randomStr}`;
  }
});

// Method to mark as paid
paymentSchema.methods.markAsPaid = function(transactionId?: string) {
  this.status = EPAYMENT_STATUS.COMPLETED;
  this.amountPaid = this.amount;
  this.paidAt = new Date();
  if (transactionId) {
    this.paystackTransactionId = transactionId;
  }
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = function(reason: string) {
  this.status = EPAYMENT_STATUS.FAILED;
  this.failedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount: number, reason: string, refundReference?: string) {
  this.status = EPAYMENT_STATUS.REFUNDED;
  this.refund = {
    amount,
    reason,
    refundedAt: new Date(),
    refundReference
  };
  return this.save();
};

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
