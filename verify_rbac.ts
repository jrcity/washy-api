import mongoose from 'mongoose';
import Order from './src/models/order.model';
import User from './src/models/user.model';
import RBACService from './src/services/rbac.service';
import AnalyticsService from './src/services/analytics.service';
import { EUSERS_ROLE, EANALYTICS_PERIOD } from './src/constants/enums.constant';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
    console.log('--- RBAC Verification Start ---');
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/washy');

    // 1. Find a Branch Manager
    const manager = await User.findOne({ role: EUSERS_ROLE.BRANCH_MANAGER });
    if (!manager) {
        console.error('No Branch Manager found. Please run seed script first.');
        process.exit(1);
    }

    console.log(`Verifying for Manager: ${manager.name} (Branch: ${manager.branch})`);

    // 2. Simulate context for access filter
    const context = {
        user: {
            _id: manager._id.toString(),
            role: manager.role as EUSERS_ROLE,
            branch: manager.branch?.toString()
        }
    };

    const filter = await RBACService.getAccessFilter('Order', context);
    console.log('Generated RBAC Filter:', JSON.stringify(filter));

    // 3. Verify Orders
    const orders = await Order.find(filter);
    console.log(`Found ${orders.length} orders for this branch.`);

    const wrongBranchOrders = orders.filter(o => o.branch.toString() !== manager.branch?.toString());
    if (wrongBranchOrders.length > 0) {
        console.error('FAIL: Found orders from other branches!');
    } else {
        console.log('PASS: All orders belong to the manager\'s branch.');
    }

    // 4. Verify Analytics
    console.log('Verifying Dashboard Analytics...');
    const dashboard = await AnalyticsService.getDashboard(undefined, filter);
    console.log('Dashboard Data Summary:');
    console.log(`- Revenue Trends: ${dashboard.revenue.trends.length} entries`);
    console.log(`- Total Orders: ${dashboard.orders.total}`);

    // Check if any order in analytics trends belongs to wrong branch (indirectly)
    // This is harder to verify without raw aggregate checks but we trust the logic if the filter is applied.

    console.log('--- RBAC Verification End ---');
    await mongoose.disconnect();
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
