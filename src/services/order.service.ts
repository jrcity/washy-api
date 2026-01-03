/**
 * Order Service
 * Business logic for order management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Order, { IOrder, IOrderItem } from '@/models/order.model';
import Service from '@/models/service.model';
import Branch from '@/models/branch.model';
import { AppError } from '@/utils/error.util';
import { otpService } from '@/utils/otp.util';
import { 
  EORDER_STATUS, 
  ESERVICE_CATEGORY,
  EDELIVERY_PROOF_TYPE 
} from '@/constants/enums.constant';

interface CreateOrderInput {
  customer: string;
  branch: string;
  items: Array<{
    service: string;
    serviceType: string;
    garmentType: string;
    quantity: number;
    notes?: string;
    isExpress: boolean;
  }>;
  pickupDate: Date;
  pickupTimeSlot: string;
  expectedDeliveryDate?: Date;
  deliveryTimeSlot?: string;
  pickupAddress: any;
  deliveryAddress?: any;
  customerNotes?: string;
  discountCode?: string;
}

interface UpdateStatusInput {
  status: EORDER_STATUS;
  updatedBy?: string;
  notes?: string;
}

class OrderService {
  
  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<IOrder> {
    // Validate branch exists and is active
    const branch = await Branch.findById(input.branch);
    if (!branch || !branch.isActive) {
      throw AppError.badRequest('Invalid or inactive branch');
    }
    
    // Calculate pricing for each item
    const processedItems: IOrderItem[] = [];
    let subtotal = 0;
    let maxDuration = 0;
    
    for (const item of input.items) {
      const service = await Service.findById(item.service);
      if (!service || !service.isActive) {
        throw AppError.badRequest(`Service not found: ${item.service}`);
      }
      
      // Find pricing for the garment type
      const pricing = service.pricing.find(
        (p) => p.garmentType === item.garmentType
      );
      
      if (!pricing) {
        throw AppError.badRequest(
          `Pricing not available for ${item.garmentType} in ${service.name}`
        );
      }
      
      let unitPrice = pricing.basePrice;
      if (item.isExpress && service.isExpressAvailable) {
        unitPrice *= pricing.expressMultiplier;
      }
      
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      
      // Track max duration for delivery estimation
      const duration = item.isExpress 
        ? service.estimatedDuration.express 
        : service.estimatedDuration.standard;
      maxDuration = Math.max(maxDuration, duration);
      
      processedItems.push({
        service: new Types.ObjectId(item.service),
        serviceType: item.serviceType,
        garmentType: item.garmentType,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        notes: item.notes,
        isExpress: item.isExpress
      } as IOrderItem);
    }
    
    // Calculate expected delivery date if not provided
    let expectedDeliveryDate = input.expectedDeliveryDate;
    if (!expectedDeliveryDate) {
      const pickupDate = new Date(input.pickupDate);
      expectedDeliveryDate = new Date(pickupDate.getTime() + maxDuration * 60 * 60 * 1000);
    }
    
    // Apply discount if code provided
    let discount = 0;
    if (input.discountCode) {
      // TODO: Implement discount code validation
      discount = 0;
    }
    
    // Calculate delivery fee based on zone
    const deliveryFee = await this.calculateDeliveryFee(
      input.pickupAddress,
      input.deliveryAddress || input.pickupAddress,
      input.branch
    );
    
    const total = subtotal - discount + deliveryFee;
    
    // Create the order
    const order = await Order.create({
      customer: input.customer,
      branch: input.branch,
      serviceCategory: ESERVICE_CATEGORY.LAUNDRY,
      items: processedItems,
      pickupDate: input.pickupDate,
      pickupTimeSlot: input.pickupTimeSlot,
      expectedDeliveryDate,
      deliveryTimeSlot: input.deliveryTimeSlot,
      pickupAddress: input.pickupAddress,
      deliveryAddress: input.deliveryAddress || input.pickupAddress,
      subtotal,
      discount,
      discountCode: input.discountCode,
      deliveryFee,
      total,
      status: EORDER_STATUS.PENDING,
      customerNotes: input.customerNotes
    });
    
    // Update branch metrics
    await Branch.findByIdAndUpdate(input.branch, {
      $inc: {
        'capacity.currentDailyOrders': 1,
        'metrics.totalOrders': 1
      }
    });
    
    return order.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'branch', select: 'name code address' },
      { path: 'items.service', select: 'name serviceType' }
    ]);
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'branch', select: 'name code address contactPhone' },
      { path: 'items.service', select: 'name serviceType' },
      { path: 'pickupRider', select: 'name phone' },
      { path: 'deliveryRider', select: 'name phone' },
      { path: 'payment' }
    ]);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    return order;
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: {
    customer?: string;
    branch?: string;
    status?: EORDER_STATUS;
    rider?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const query: any = {};
    
    if (filters.customer) query.customer = filters.customer;
    if (filters.branch) query.branch = filters.branch;
    if (filters.status) query.status = filters.status;
    if (filters.rider) {
      query.$or = [
        { pickupRider: filters.rider },
        { deliveryRider: filters.rider }
      ];
    }
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const sort = filters.sort || '-createdAt';
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate([
          { path: 'customer', select: 'name phone' },
          { path: 'branch', select: 'name code' }
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    input: UpdateStatusInput
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    // Validate status transition
    this.validateStatusTransition(order.status, input.status);
    
    order.status = input.status;
    order.statusHistory.push({
      status: input.status,
      timestamp: new Date(),
      updatedBy: input.updatedBy ? new Types.ObjectId(input.updatedBy) : undefined,
      notes: input.notes
    });
    
    // Handle specific status updates
    if (input.status === EORDER_STATUS.CANCELLED) {
      order.cancelledAt = new Date();
      order.cancellationReason = input.notes;
    }
    
    if (input.status === EORDER_STATUS.COMPLETED) {
      // Update branch revenue
      await Branch.findByIdAndUpdate(order.branch, {
        $inc: { 'metrics.totalRevenue': order.total }
      });
    }
    
    await order.save();
    
    // TODO: Send notification to customer
    
    return order;
  }

  /**
   * Assign rider to order
   */
  async assignRider(
    orderId: string,
    riderId: string,
    type: 'pickup' | 'delivery'
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    if (type === 'pickup') {
      order.pickupRider = new Types.ObjectId(riderId);
      // Move to confirmed status if still pending
      if (order.status === EORDER_STATUS.PENDING) {
        await this.updateOrderStatus(orderId, { 
          status: EORDER_STATUS.CONFIRMED 
        });
      }
    } else {
      order.deliveryRider = new Types.ObjectId(riderId);
    }
    
    await order.save();
    
    // TODO: Send notification to rider
    
    return order;
  }

  /**
   * Verify delivery with OTP or photo
   */
  async verifyDelivery(
    orderId: string,
    proof: {
      type: EDELIVERY_PROOF_TYPE;
      photoUrl?: string;
      otpCode?: string;
      signature?: string;
    }
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    if (order.status !== EORDER_STATUS.OUT_FOR_DELIVERY) {
      throw AppError.badRequest('Order is not out for delivery');
    }
    
    // Verify OTP if provided
    if (proof.type === EDELIVERY_PROOF_TYPE.OTP_CODE && proof.otpCode) {
      if (!order.deliveryProof?.otpCode) {
        throw AppError.badRequest('No OTP generated for this order');
      }
      
      const isValid = otpService.verify(proof.otpCode, order.deliveryProof.otpCode);
      if (!isValid) {
        throw AppError.badRequest('Invalid OTP code');
      }
    }
    
    order.deliveryProof = {
      type: proof.type,
      photoUrl: proof.photoUrl,
      otpCode: proof.otpCode,
      signature: proof.signature,
      verifiedAt: new Date()
    };
    
    // Update status to delivered
    await this.updateOrderStatus(orderId, { 
      status: EORDER_STATUS.DELIVERED,
      notes: `Verified via ${proof.type}` 
    });
    
    return order.save();
  }

  /**
   * Generate OTP for delivery
   */
  async generateDeliveryOtp(orderId: string): Promise<string> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    const otp = otpService.generate();
    const hashedOtp = otpService.hash(otp);
    
    order.deliveryProof = {
      type: EDELIVERY_PROOF_TYPE.OTP_CODE,
      otpCode: hashedOtp
    };
    
    await order.save();
    
    // TODO: Send OTP to customer via SMS/WhatsApp
    
    return otp;
  }

  /**
   * Rate order
   */
  async rateOrder(
    orderId: string,
    rating: number,
    feedback?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    if (order.status !== EORDER_STATUS.COMPLETED && order.status !== EORDER_STATUS.DELIVERED) {
      throw AppError.badRequest('Can only rate completed orders');
    }
    
    order.rating = rating;
    order.feedback = feedback;
    
    // Update branch rating
    const branch = await Branch.findById(order.branch);
    if (branch) {
      const totalReviews = branch.metrics.totalReviews + 1;
      const newAverage = (
        (branch.metrics.averageRating * branch.metrics.totalReviews) + rating
      ) / totalReviews;
      
      branch.metrics.averageRating = Math.round(newAverage * 10) / 10;
      branch.metrics.totalReviews = totalReviews;
      await branch.save();
    }
    
    return order.save();
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    
    // Can only cancel if not yet picked up
    const nonCancellableStatuses = [
      EORDER_STATUS.IN_PROCESS,
      EORDER_STATUS.READY,
      EORDER_STATUS.OUT_FOR_DELIVERY,
      EORDER_STATUS.DELIVERED,
      EORDER_STATUS.COMPLETED,
      EORDER_STATUS.CANCELLED
    ];
    
    if (nonCancellableStatuses.includes(order.status)) {
      throw AppError.badRequest('Order cannot be cancelled at this stage');
    }
    
    return this.updateOrderStatus(orderId, {
      status: EORDER_STATUS.CANCELLED,
      updatedBy: cancelledBy,
      notes: reason
    });
  }

  /**
   * Calculate delivery fee
   */
  private async calculateDeliveryFee(
    pickupAddress: any,
    deliveryAddress: any,
    branchId: string
  ): Promise<number> {
    // Base delivery fee
    let fee = 500; // ₦500 base fee
    
    // Add fee if delivery address is different from pickup
    if (
      pickupAddress.area !== deliveryAddress.area ||
      pickupAddress.city !== deliveryAddress.city
    ) {
      fee += 300; // Extra ₦300 for different areas
    }
    
    // TODO: Implement zone-based pricing
    
    return fee;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: EORDER_STATUS,
    newStatus: EORDER_STATUS
  ): void {
    const validTransitions: Record<EORDER_STATUS, EORDER_STATUS[]> = {
      [EORDER_STATUS.PENDING]: [EORDER_STATUS.CONFIRMED, EORDER_STATUS.CANCELLED],
      [EORDER_STATUS.CONFIRMED]: [EORDER_STATUS.PICKED_UP, EORDER_STATUS.CANCELLED],
      [EORDER_STATUS.PICKED_UP]: [EORDER_STATUS.IN_PROCESS],
      [EORDER_STATUS.IN_PROCESS]: [EORDER_STATUS.READY],
      [EORDER_STATUS.READY]: [EORDER_STATUS.OUT_FOR_DELIVERY],
      [EORDER_STATUS.OUT_FOR_DELIVERY]: [EORDER_STATUS.DELIVERED],
      [EORDER_STATUS.DELIVERED]: [EORDER_STATUS.COMPLETED],
      [EORDER_STATUS.COMPLETED]: [],
      [EORDER_STATUS.CANCELLED]: []
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw AppError.badRequest(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(branchId?: string, startDate?: Date, endDate?: Date) {
    const match: any = {};
    
    if (branchId) match.branch = new Types.ObjectId(branchId);
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }
    
    const stats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);
    
    const totalOrders = stats.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
    
    return {
      byStatus: stats,
      totalOrders,
      totalRevenue
    };
  }
}

export default new OrderService();
