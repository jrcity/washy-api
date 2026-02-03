/**
 * Analytics Routes
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Router } from 'express';
import AnalyticsController from '@/controllers/analytics.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validateQuery } from '@/middlewares/validation.middleware';
import { analyticsQueryValidation } from '@/validations/analytics.validation';
import { EUSERS_ROLE } from '@/constants/enums.constant';

const router = Router();

// All analytics routes require authentication and admin access
router.use(authenticate);
router.use(authorize(EUSERS_ROLE.ADMIN, EUSERS_ROLE.SUPER_ADMIN, EUSERS_ROLE.BRANCH_MANAGER));

// Revenue Analytics
router.get('/revenue/overview', validateQuery(analyticsQueryValidation), AnalyticsController.getRevenueOverview);
router.get('/revenue/by-branch', validateQuery(analyticsQueryValidation), AnalyticsController.getRevenueByBranch);
router.get('/revenue/by-service', validateQuery(analyticsQueryValidation), AnalyticsController.getRevenueByService);
router.get('/revenue/top-customers', validateQuery(analyticsQueryValidation), AnalyticsController.getTopCustomers);

// Order Insights
router.get('/orders/volume', validateQuery(analyticsQueryValidation), AnalyticsController.getOrderVolume);
router.get('/orders/completion', AnalyticsController.getOrderCompletionRates);
router.get('/orders/turnaround', AnalyticsController.getAverageTurnaroundTime);
router.get('/orders/peak-hours', AnalyticsController.getPeakHours);

// Customer Analytics
router.get('/customers/acquisition', validateQuery(analyticsQueryValidation), AnalyticsController.getCustomerAcquisition);
router.get('/customers/retention', AnalyticsController.getCustomerRetention);
router.get('/customers/ltv', AnalyticsController.getCustomerLifetimeValue);

// Branch Performance
router.get('/branches/comparison', AnalyticsController.getBranchComparison);
router.get('/branches/rankings', AnalyticsController.getBranchRankings);

// Rider Statistics
router.get('/riders/performance', AnalyticsController.getRiderPerformance);
router.get('/riders/delivery-times', AnalyticsController.getDeliveryTimes);

// Combined Dashboard
router.get('/dashboard', AnalyticsController.getDashboard);

export default router;
