/**
 * Analytics Service
 * Business intelligence and reporting
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Order from '@/models/order.model';
import User from '@/models/user.model';
import Branch from '@/models/branch.model';
import Payment from '@/models/payment.model';
import { EORDER_STATUS, EUSERS_ROLE, EPAYMENT_STATUS, EANALYTICS_PERIOD } from '@/constants/enums.constant';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

class AnalyticsService {
    /**
     * Get date range based on period
     */
    private getDateRange(period: EANALYTICS_PERIOD): DateRange {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case EANALYTICS_PERIOD.DAILY:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case EANALYTICS_PERIOD.WEEKLY:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case EANALYTICS_PERIOD.MONTHLY:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case EANALYTICS_PERIOD.QUARTERLY:
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case EANALYTICS_PERIOD.YEARLY:
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        return { startDate, endDate: now };
    }

    // ============== REVENUE ANALYTICS ==============

    /**
     * Get revenue overview with trends
     */
    async getRevenueOverview(period: EANALYTICS_PERIOD, branchId?: string) {
        const { startDate, endDate } = this.getDateRange(period);
        const match: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
        };

        if (branchId) match.branch = new Types.ObjectId(branchId);

        // Group by date for trend
        const groupByFormat = period === EANALYTICS_PERIOD.DAILY ? '%Y-%m-%d %H:00'
            : period === EANALYTICS_PERIOD.YEARLY ? '%Y-%m'
                : '%Y-%m-%d';

        const trends = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate totals
        const totals = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' },
                    totalDeliveryFees: { $sum: '$deliveryFee' }
                }
            }
        ]);

        // Previous period comparison
        const prevStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
        const prevMatch = { ...match, createdAt: { $gte: prevStartDate, $lte: startDate } };

        const prevTotals = await Order.aggregate([
            { $match: prevMatch },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const current = totals[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
        const previous = prevTotals[0] || { totalRevenue: 0, totalOrders: 0 };

        return {
            period,
            dateRange: { startDate, endDate },
            current: {
                ...current,
                avgOrderValue: Math.round(current.avgOrderValue || 0)
            },
            previous,
            growth: {
                revenueGrowth: previous.totalRevenue > 0
                    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue * 100).toFixed(2)
                    : 0,
                orderGrowth: previous.totalOrders > 0
                    ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders * 100).toFixed(2)
                    : 0
            },
            trends
        };
    }

    /**
     * Get revenue by branch
     */
    async getRevenueByBranch(startDate: Date, endDate: Date) {
        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
                }
            },
            {
                $group: {
                    _id: '$branch',
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: '$branch' },
            {
                $project: {
                    branchId: '$_id',
                    branchName: '$branch.name',
                    branchCode: '$branch.code',
                    revenue: 1,
                    orders: 1,
                    avgOrderValue: { $round: ['$avgOrderValue', 2] }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return result;
    }

    /**
     * Get revenue by service
     */
    async getRevenueByService(startDate: Date, endDate: Date, branchId?: string) {
        const match: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
        };
        if (branchId) match.branch = new Types.ObjectId(branchId);

        const result = await Order.aggregate([
            { $match: match },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.service',
                    revenue: { $sum: '$items.subtotal' },
                    quantity: { $sum: '$items.quantity' },
                    orders: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: '$service' },
            {
                $project: {
                    serviceId: '$_id',
                    serviceName: '$service.name',
                    serviceType: '$service.serviceType',
                    revenue: 1,
                    quantity: 1,
                    orders: 1
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return result;
    }

    /**
     * Get top customers by spending
     */
    async getTopCustomers(limit: number, period: EANALYTICS_PERIOD) {
        const { startDate, endDate } = this.getDateRange(period);

        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
                }
            },
            {
                $group: {
                    _id: '$customer',
                    totalSpent: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    customerId: '$_id',
                    name: '$customer.name',
                    email: '$customer.email',
                    phone: '$customer.phone',
                    totalSpent: 1,
                    orderCount: 1,
                    avgOrderValue: { $round: ['$avgOrderValue', 2] }
                }
            }
        ]);

        return result;
    }

    // ============== ORDER INSIGHTS ==============

    /**
     * Get order volume trends
     */
    async getOrderVolume(period: EANALYTICS_PERIOD, branchId?: string) {
        const { startDate, endDate } = this.getDateRange(period);
        const match: any = { createdAt: { $gte: startDate, $lte: endDate } };
        if (branchId) match.branch = new Types.ObjectId(branchId);

        const groupByFormat = period === EANALYTICS_PERIOD.DAILY ? '%H:00' : '%Y-%m-%d';

        const volumeByTime = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const volumeByStatus = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return { volumeByTime, volumeByStatus };
    }

    /**
     * Get order completion rates
     */
    async getOrderCompletionRates(branchId?: string) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const match: any = { createdAt: { $gte: thirtyDaysAgo } };
        if (branchId) match.branch = new Types.ObjectId(branchId);

        const stats = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = stats.reduce((sum, s) => sum + s.count, 0);
        const completed = stats.find(s => s._id === EORDER_STATUS.COMPLETED)?.count || 0;
        const delivered = stats.find(s => s._id === EORDER_STATUS.DELIVERED)?.count || 0;
        const cancelled = stats.find(s => s._id === EORDER_STATUS.CANCELLED)?.count || 0;

        return {
            total,
            completed: completed + delivered,
            cancelled,
            completionRate: total > 0 ? ((completed + delivered) / total * 100).toFixed(2) : 0,
            cancellationRate: total > 0 ? (cancelled / total * 100).toFixed(2) : 0,
            byStatus: stats
        };
    }

    /**
     * Get average turnaround time
     */
    async getAverageTurnaroundTime(branchId?: string) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const match: any = {
            createdAt: { $gte: thirtyDaysAgo },
            status: EORDER_STATUS.COMPLETED
        };
        if (branchId) match.branch = new Types.ObjectId(branchId);

        // Calculate time from order creation to completion
        const result = await Order.aggregate([
            { $match: match },
            {
                $project: {
                    turnaroundHours: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$createdAt'] },
                            1000 * 60 * 60 // Convert to hours
                        ]
                    },
                    branch: 1
                }
            },
            {
                $group: {
                    _id: branchId ? null : '$branch',
                    avgTurnaroundHours: { $avg: '$turnaroundHours' },
                    minTurnaroundHours: { $min: '$turnaroundHours' },
                    maxTurnaroundHours: { $max: '$turnaroundHours' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return result.map(r => ({
            ...r,
            avgTurnaroundHours: Math.round(r.avgTurnaroundHours * 10) / 10,
            minTurnaroundHours: Math.round(r.minTurnaroundHours * 10) / 10,
            maxTurnaroundHours: Math.round(r.maxTurnaroundHours * 10) / 10
        }));
    }

    /**
     * Get peak ordering hours
     */
    async getPeakHours() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return result.map(r => ({
            hour: r._id,
            hourLabel: `${r._id}:00 - ${r._id + 1}:00`,
            orderCount: r.count,
            revenue: r.revenue
        }));
    }

    // ============== CUSTOMER ANALYTICS ==============

    /**
     * Get customer acquisition trends
     */
    async getCustomerAcquisition(period: EANALYTICS_PERIOD) {
        const { startDate, endDate } = this.getDateRange(period);
        const groupByFormat = period === EANALYTICS_PERIOD.YEARLY ? '%Y-%m' : '%Y-%m-%d';

        const result = await User.aggregate([
            {
                $match: {
                    role: EUSERS_ROLE.CUSTOMER,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
                    newCustomers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const total = await User.countDocuments({
            role: EUSERS_ROLE.CUSTOMER,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        return { total, trends: result };
    }

    /**
     * Get customer retention rate
     */
    async getCustomerRetention() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        // Customers who ordered in past 30-60 days
        const previousCustomers = await Order.distinct('customer', {
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });

        // Of those, who ordered again in past 30 days
        const retainedCustomers = await Order.distinct('customer', {
            customer: { $in: previousCustomers },
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Customers with multiple orders ever
        const repeatCustomers = await Order.aggregate([
            {
                $group: {
                    _id: '$customer',
                    orderCount: { $sum: 1 }
                }
            },
            { $match: { orderCount: { $gt: 1 } } },
            { $count: 'repeatCustomers' }
        ]);

        const totalCustomers = await User.countDocuments({ role: EUSERS_ROLE.CUSTOMER });

        return {
            totalCustomers,
            previousPeriodCustomers: previousCustomers.length,
            retainedCustomers: retainedCustomers.length,
            retentionRate: previousCustomers.length > 0
                ? (retainedCustomers.length / previousCustomers.length * 100).toFixed(2)
                : 0,
            repeatCustomerCount: repeatCustomers[0]?.repeatCustomers || 0,
            repeatCustomerRate: totalCustomers > 0
                ? ((repeatCustomers[0]?.repeatCustomers || 0) / totalCustomers * 100).toFixed(2)
                : 0
        };
    }

    /**
     * Get customer lifetime value
     */
    async getCustomerLifetimeValue() {
        const result = await Order.aggregate([
            {
                $match: {
                    status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
                }
            },
            {
                $group: {
                    _id: '$customer',
                    totalSpent: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    firstOrder: { $min: '$createdAt' },
                    lastOrder: { $max: '$createdAt' }
                }
            },
            {
                $group: {
                    _id: null,
                    avgLifetimeValue: { $avg: '$totalSpent' },
                    avgOrdersPerCustomer: { $avg: '$orderCount' },
                    maxLifetimeValue: { $max: '$totalSpent' },
                    totalCustomersWithOrders: { $sum: 1 }
                }
            }
        ]);

        const stats = result[0] || {
            avgLifetimeValue: 0,
            avgOrdersPerCustomer: 0,
            maxLifetimeValue: 0,
            totalCustomersWithOrders: 0
        };

        return {
            avgLifetimeValue: Math.round(stats.avgLifetimeValue),
            avgOrdersPerCustomer: Math.round(stats.avgOrdersPerCustomer * 10) / 10,
            maxLifetimeValue: stats.maxLifetimeValue,
            totalCustomersWithOrders: stats.totalCustomersWithOrders
        };
    }

    // ============== BRANCH PERFORMANCE ==============

    /**
     * Get branch comparison
     */
    async getBranchComparison() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Branch.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { branchId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$branch', '$$branchId'] },
                                createdAt: { $gte: thirtyDaysAgo }
                            }
                        }
                    ],
                    as: 'recentOrders'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    isActive: 1,
                    'metrics.averageRating': 1,
                    'metrics.totalReviews': 1,
                    orderCount: { $size: '$recentOrders' },
                    revenue: { $sum: '$recentOrders.total' },
                    avgOrderValue: { $avg: '$recentOrders.total' },
                    completedOrders: {
                        $size: {
                            $filter: {
                                input: '$recentOrders',
                                as: 'order',
                                cond: { $eq: ['$$order.status', EORDER_STATUS.COMPLETED] }
                            }
                        }
                    }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return result;
    }

    /**
     * Get branch rankings by metric
     */
    async getBranchRankings(metric: 'revenue' | 'orders' | 'rating') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Branch.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { branchId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$branch', '$$branchId'] },
                                createdAt: { $gte: thirtyDaysAgo },
                                status: { $in: [EORDER_STATUS.COMPLETED, EORDER_STATUS.DELIVERED] }
                            }
                        }
                    ],
                    as: 'orders'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    revenue: { $sum: '$orders.total' },
                    orders: { $size: '$orders' },
                    rating: '$metrics.averageRating'
                }
            },
            { $sort: { [metric]: -1 } }
        ]);

        return result.map((branch, index) => ({
            rank: index + 1,
            ...branch
        }));
    }

    // ============== RIDER STATISTICS ==============

    /**
     * Get rider performance
     */
    async getRiderPerformance(riderId?: string) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const match: any = { createdAt: { $gte: thirtyDaysAgo } };

        if (riderId) {
            match.$or = [
                { pickupRider: new Types.ObjectId(riderId) },
                { deliveryRider: new Types.ObjectId(riderId) }
            ];
        } else {
            match.$or = [
                { pickupRider: { $exists: true, $ne: null } },
                { deliveryRider: { $exists: true, $ne: null } }
            ];
        }

        // Pickup stats
        const pickupStats = await Order.aggregate([
            { $match: { ...match, pickupRider: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$pickupRider',
                    pickupCount: { $sum: 1 },
                    completedPickups: {
                        $sum: {
                            $cond: [{ $in: ['$status', [EORDER_STATUS.PICKED_UP, EORDER_STATUS.IN_PROCESS, EORDER_STATUS.READY, EORDER_STATUS.OUT_FOR_DELIVERY, EORDER_STATUS.DELIVERED, EORDER_STATUS.COMPLETED]] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Delivery stats
        const deliveryStats = await Order.aggregate([
            { $match: { ...match, deliveryRider: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$deliveryRider',
                    deliveryCount: { $sum: 1 },
                    completedDeliveries: {
                        $sum: {
                            $cond: [{ $in: ['$status', [EORDER_STATUS.DELIVERED, EORDER_STATUS.COMPLETED]] }, 1, 0]
                        }
                    },
                    avgRating: { $avg: '$rating' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'rider'
                }
            },
            { $unwind: '$rider' },
            {
                $project: {
                    riderId: '$_id',
                    riderName: '$rider.name',
                    deliveryCount: 1,
                    completedDeliveries: 1,
                    avgRating: { $round: ['$avgRating', 1] }
                }
            },
            { $sort: { completedDeliveries: -1 } }
        ]);

        return { pickupStats, deliveryStats };
    }

    /**
     * Get delivery time analytics
     */
    async getDeliveryTimes() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Calculate time from OUT_FOR_DELIVERY to DELIVERED
        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $in: [EORDER_STATUS.DELIVERED, EORDER_STATUS.COMPLETED] },
                    deliveryRider: { $exists: true }
                }
            },
            { $unwind: '$statusHistory' },
            {
                $match: {
                    'statusHistory.status': { $in: [EORDER_STATUS.OUT_FOR_DELIVERY, EORDER_STATUS.DELIVERED] }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    deliveryRider: { $first: '$deliveryRider' },
                    timestamps: { $push: '$statusHistory' }
                }
            },
            {
                $project: {
                    deliveryRider: 1,
                    outForDelivery: {
                        $filter: {
                            input: '$timestamps',
                            as: 't',
                            cond: { $eq: ['$$t.status', EORDER_STATUS.OUT_FOR_DELIVERY] }
                        }
                    },
                    delivered: {
                        $filter: {
                            input: '$timestamps',
                            as: 't',
                            cond: { $eq: ['$$t.status', EORDER_STATUS.DELIVERED] }
                        }
                    }
                }
            }
        ]);

        // Calculate average delivery times
        const deliveryTimes = result
            .filter(r => r.outForDelivery.length > 0 && r.delivered.length > 0)
            .map(r => ({
                riderId: r.deliveryRider,
                deliveryMinutes: (new Date(r.delivered[0].timestamp).getTime() -
                    new Date(r.outForDelivery[0].timestamp).getTime()) / (1000 * 60)
            }));

        const avgDeliveryTime = deliveryTimes.length > 0
            ? deliveryTimes.reduce((sum, d) => sum + d.deliveryMinutes, 0) / deliveryTimes.length
            : 0;

        return {
            avgDeliveryMinutes: Math.round(avgDeliveryTime),
            totalDeliveries: deliveryTimes.length
        };
    }

    // ============== DASHBOARD ==============

    /**
     * Get combined dashboard data
     */
    async getDashboard(branchId?: string) {
        const [
            revenueOverview,
            completionRates,
            peakHours,
            customerRetention,
            riderPerformance
        ] = await Promise.all([
            this.getRevenueOverview(EANALYTICS_PERIOD.MONTHLY, branchId),
            this.getOrderCompletionRates(branchId),
            this.getPeakHours(),
            this.getCustomerRetention(),
            this.getRiderPerformance()
        ]);

        return {
            revenue: revenueOverview,
            orders: completionRates,
            peakHours: peakHours.slice(0, 5), // Top 5 peak hours
            customers: customerRetention,
            riders: {
                topDeliveries: riderPerformance.deliveryStats.slice(0, 5)
            }
        };
    }
}

export default new AnalyticsService();
