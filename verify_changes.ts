import mongoose from 'mongoose';
import { Branch } from './src/models/branch.model';
import { Order } from './src/models/order.model';
import branchService from './src/services/branch.service';
import orderService from './src/services/order.service';
import { EUSERS_ROLE, EORDER_STATUS } from './src/constants/enums.constant';

async function verify() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/washy');
    console.log('Connected to MongoDB');

    try {
        // 1. Verify Branch Sorting
        console.log('\n--- Verifying Branch Sorting ---');
        await Branch.deleteMany({});
        const b1 = await Branch.create({
            name: 'Featured Branch 1',
            code: 'FB1',
            address: { street: 'S1', area: 'A1', city: 'C1', state: 'Lagos', coordinates: { lat: 10, lng: 10 } },
            contactPhone: '123', contactEmail: 'b1@test.com',
            is_featured: true
        });
        const b2 = await Branch.create({
            name: 'Normal Branch 1',
            code: 'NB1',
            address: { street: 'S2', area: 'A2', city: 'C2', state: 'Lagos', coordinates: { lat: 1, lng: 1 } },
            contactPhone: '456', contactEmail: 'b2@test.com',
            is_featured: false
        });
        const b3 = await Branch.create({
            name: 'Featured Branch 2',
            code: 'FB2',
            address: { street: 'S3', area: 'A3', city: 'C3', state: 'Lagos', coordinates: { lat: 20, lng: 20 } },
            contactPhone: '789', contactEmail: 'b3@test.com',
            is_featured: true
        });

        const sortedBranches = await branchService.getBranches({ lat: 0, lng: 0 });
        console.log('Sorted Branches (Target: (10,10) Featured, (20,20) Featured, (1,1) Normal):');
        sortedBranches.branches.forEach(b => console.log(`- ${b.name} (is_featured: ${b.is_featured}, distance: ${(b as any).distance.toFixed(4)})`));

        // 2. Verify RBAC Filter
        console.log('\n--- Verifying RBAC Order Visibility ---');
        await Order.deleteMany({});
        const o1 = await Order.create({
            orderNumber: 'ORD-1', customer: new mongoose.Types.ObjectId(), branch: b1._id,
            items: [], pickupDate: new Date(), pickupTimeSlot: '9-12', expectedDeliveryDate: new Date(),
            pickupAddress: { street: 'S1', area: 'A1', city: 'C1' }, deliveryAddress: { street: 'S1', area: 'A1', city: 'C1' },
            subtotal: 100, total: 100, status: EORDER_STATUS.PENDING
        });
        const o2 = await Order.create({
            orderNumber: 'ORD-2', customer: new mongoose.Types.ObjectId(), branch: b2._id,
            items: [], pickupDate: new Date(), pickupTimeSlot: '9-12', expectedDeliveryDate: new Date(),
            pickupAddress: { street: 'S1', area: 'A1', city: 'C1' }, deliveryAddress: { street: 'S1', area: 'A1', city: 'C1' },
            subtotal: 100, total: 100, status: EORDER_STATUS.PENDING
        });

        const managerFilter = { branch: b1._id };
        const managerOrders = await orderService.getOrders({ accessFilter: managerFilter });
        console.log(`Manager of Branch 1 sees ${managerOrders.orders.length} orders (Expected: 1)`);
        managerOrders.orders.forEach(o => console.log(`- Order: ${o.orderNumber}, Branch: ${o.branch.name}`));

        const adminFilter = {};
        const adminOrders = await orderService.getOrders({ accessFilter: adminFilter });
        console.log(`Admin sees ${adminOrders.orders.length} orders (Expected: 2)`);

    } finally {
        await mongoose.disconnect();
    }
}

verify().catch(console.error);
