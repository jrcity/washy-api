/**
 * Payment Service - Paystack Integration
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import Payment, { IPayment } from '@/models/payment.model';
import Order from '@/models/order.model';
import { AppError } from '@/utils/error.util';
import { CONFIGS } from '@/constants/configs.constant';
import { EPAYMENT_STATUS, EPAYMENT_METHOD } from '@/constants/enums.constant';

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
    status?: string;
    amount?: number;
  };
}

class PaymentService {
  async initializePayment(orderId: string, customerId: string, method: EPAYMENT_METHOD, callbackUrl?: string): Promise<IPayment> {
    const order = await Order.findById(orderId).populate('customer', 'email');
    if (!order) throw AppError.notFound('Order not found');
    if (order.isPaid) throw AppError.badRequest('Order already paid');

    const payment = await Payment.create({
      order: orderId, customer: customerId, amount: order.total,
      method, status: EPAYMENT_STATUS.PENDING
    });

    if ([EPAYMENT_METHOD.CARD, EPAYMENT_METHOD.BANK_TRANSFER, EPAYMENT_METHOD.USSD].includes(method)) {
      const res = await fetch(`${CONFIGS.PAYSTACK.BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIGS.PAYSTACK.SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (order.customer as any)?.email || 'customer@washy.com',
          amount: payment.amount * 100, reference: payment.paystackReference,
          callback_url: callbackUrl || `${CONFIGS.APP.URL}/api/v1/payments/callback`,
          metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber }
        })
      });
      const data = await res.json() as PaystackResponse;
      if (data.status && data.data) {
        payment.paystackAccessCode = data.data.access_code;
        payment.paystackAuthorizationUrl = data.data.authorization_url;
        await payment.save();
      }
    }
    return payment;
  }

  async verifyPayment(reference: string): Promise<IPayment> {
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) throw AppError.notFound('Payment not found');
    if (payment.status === EPAYMENT_STATUS.COMPLETED) return payment;

    const res = await fetch(`${CONFIGS.PAYSTACK.BASE_URL}/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${CONFIGS.PAYSTACK.SECRET_KEY}` }
    });
    const data = await res.json() as PaystackResponse;

    if (data.status && data.data?.status === 'success') {
      payment.status = EPAYMENT_STATUS.COMPLETED;
      payment.amountPaid = (data.data.amount || 0) / 100;
      payment.paidAt = new Date();
      await payment.save();
      await Order.findByIdAndUpdate(payment.order, { isPaid: true, payment: payment._id });
    }
    return payment;
  }

  async recordCashPayment(orderId: string, customerId: string, amount: number): Promise<IPayment> {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    const payment = await Payment.create({
      order: orderId, customer: customerId, amount: order.total,
      amountPaid: amount, method: EPAYMENT_METHOD.CASH,
      status: EPAYMENT_STATUS.COMPLETED, paidAt: new Date()
    });
    await Order.findByIdAndUpdate(orderId, { isPaid: true, payment: payment._id });
    return payment;
  }

  async getPaymentById(paymentId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId).populate('order customer');
    if (!payment) throw AppError.notFound('Payment not found');
    return payment;
  }

  async getPayments(filters: any) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.method) query.method = filters.method;
    if (filters.customer) query.customer = filters.customer;

    const page = filters.page || 1, limit = filters.limit || 10;
    const [payments, total] = await Promise.all([
      Payment.find(query).populate('order', 'orderNumber').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Payment.countDocuments(query)
    ]);
    return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) }};
  }
}

export default new PaymentService();
