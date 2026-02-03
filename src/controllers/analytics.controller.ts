/**
 * Analytics Controller
 * HTTP handlers for analytics endpoints
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Request, Response } from 'express';
import analyticsService from '@/services/analytics.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { EANALYTICS_PERIOD } from '@/constants/enums.constant';

class AnalyticsController {
    // Revenue Analytics
    getRevenueOverview = asyncHandler(async (req: Request, res: Response) => {
        const period = (req.query.period as EANALYTICS_PERIOD) || EANALYTICS_PERIOD.MONTHLY;
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getRevenueOverview(period, branchId);
        return ResponseHandler.success(res, result, 'Revenue overview retrieved');
    });

    getRevenueByBranch = asyncHandler(async (req: Request, res: Response) => {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        const result = await analyticsService.getRevenueByBranch(startDate, endDate);
        return ResponseHandler.success(res, result, 'Revenue by branch retrieved');
    });

    getRevenueByService = asyncHandler(async (req: Request, res: Response) => {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getRevenueByService(startDate, endDate, branchId);
        return ResponseHandler.success(res, result, 'Revenue by service retrieved');
    });

    getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 10;
        const period = (req.query.period as EANALYTICS_PERIOD) || EANALYTICS_PERIOD.MONTHLY;
        const result = await analyticsService.getTopCustomers(limit, period);
        return ResponseHandler.success(res, result, 'Top customers retrieved');
    });

    // Order Insights
    getOrderVolume = asyncHandler(async (req: Request, res: Response) => {
        const period = (req.query.period as EANALYTICS_PERIOD) || EANALYTICS_PERIOD.MONTHLY;
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getOrderVolume(period, branchId);
        return ResponseHandler.success(res, result, 'Order volume retrieved');
    });

    getOrderCompletionRates = asyncHandler(async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getOrderCompletionRates(branchId);
        return ResponseHandler.success(res, result, 'Order completion rates retrieved');
    });

    getAverageTurnaroundTime = asyncHandler(async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getAverageTurnaroundTime(branchId);
        return ResponseHandler.success(res, result, 'Average turnaround time retrieved');
    });

    getPeakHours = asyncHandler(async (req: Request, res: Response) => {
        const result = await analyticsService.getPeakHours();
        return ResponseHandler.success(res, result, 'Peak hours retrieved');
    });

    // Customer Analytics
    getCustomerAcquisition = asyncHandler(async (req: Request, res: Response) => {
        const period = (req.query.period as EANALYTICS_PERIOD) || EANALYTICS_PERIOD.MONTHLY;
        const result = await analyticsService.getCustomerAcquisition(period);
        return ResponseHandler.success(res, result, 'Customer acquisition data retrieved');
    });

    getCustomerRetention = asyncHandler(async (req: Request, res: Response) => {
        const result = await analyticsService.getCustomerRetention();
        return ResponseHandler.success(res, result, 'Customer retention data retrieved');
    });

    getCustomerLifetimeValue = asyncHandler(async (req: Request, res: Response) => {
        const result = await analyticsService.getCustomerLifetimeValue();
        return ResponseHandler.success(res, result, 'Customer lifetime value retrieved');
    });

    // Branch Performance
    getBranchComparison = asyncHandler(async (req: Request, res: Response) => {
        const result = await analyticsService.getBranchComparison();
        return ResponseHandler.success(res, result, 'Branch comparison retrieved');
    });

    getBranchRankings = asyncHandler(async (req: Request, res: Response) => {
        const metric = (req.query.metric as 'revenue' | 'orders' | 'rating') || 'revenue';
        const result = await analyticsService.getBranchRankings(metric);
        return ResponseHandler.success(res, result, 'Branch rankings retrieved');
    });

    // Rider Statistics
    getRiderPerformance = asyncHandler(async (req: Request, res: Response) => {
        const riderId = req.query.riderId as string | undefined;
        const result = await analyticsService.getRiderPerformance(riderId);
        return ResponseHandler.success(res, result, 'Rider performance retrieved');
    });

    getDeliveryTimes = asyncHandler(async (req: Request, res: Response) => {
        const result = await analyticsService.getDeliveryTimes();
        return ResponseHandler.success(res, result, 'Delivery times retrieved');
    });

    // Dashboard
    getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string | undefined;
        const result = await analyticsService.getDashboard(branchId);
        return ResponseHandler.success(res, result, 'Dashboard data retrieved');
    });
}

export default new AnalyticsController();
