import mongoose from 'mongoose';
import User from './src/models/user.model';
import Branch from './src/models/branch.model';
import AuthService from './src/services/auth.service';
import BranchService from './src/services/branch.service';
import { EUSERS_ROLE } from './src/constants/enums.constant';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
    console.log('--- Branch/Staff Management Verification Start ---');
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/washy');

    try {
        // 1. Setup: Find/Create an Admin
        let admin = await User.findOne({ role: EUSERS_ROLE.ADMIN });
        if (!admin) {
            console.log('No Admin found, creating one...');
            admin = await User.create({
                name: 'Test Admin',
                phone: '08000000000',
                passwordHash: 'dummy',
                role: EUSERS_ROLE.ADMIN
            });
        }

        // 2. Setup: Find/Create a User to be Manager
        let managerCandidate = await User.findOne({ phone: '08011111111' });
        if (!managerCandidate) {
            managerCandidate = await User.create({
                name: 'Test Manager',
                phone: '08011111111',
                passwordHash: 'dummy',
                role: EUSERS_ROLE.BRANCH_MANAGER
            });
        }

        // 3. Admin creates a branch
        console.log('Admin creating/resetting branch...');
        let branch = await Branch.findOne({ code: 'TST-001' });
        if (branch) await branch.deleteOne();

        branch = await BranchService.createBranch({
            name: 'Test Branch',
            code: 'TST-001',
            address: { street: 'Main', area: 'Ikeja', city: 'Lagos', state: 'Lagos' },
            contactPhone: '0123456789',
            contactEmail: 'test@branch.com'
        });
        console.log(`Branch created: ${branch.name} (${branch._id})`);

        // 4. Admin assigns manager
        console.log('Admin assigning manager...');
        await BranchService.assignManager(branch._id.toString(), managerCandidate._id.toString());

        // Verify bidirectional sync
        const updatedManager = await User.findById(managerCandidate._id);
        if (updatedManager?.branch?.toString() === branch._id.toString() &&
            (updatedManager as any).managedBranch?.toString() === branch._id.toString()) {
            console.log('PASS: Manager branch sync successful.');
        } else {
            console.error('FAIL: Manager branch sync failed.');
            console.log('Manager Data:', JSON.stringify(updatedManager));
        }

        // 5. Manager creates a staff member
        console.log('Manager creating staff member...');
        const staffPhone = '08022222222';
        await User.deleteOne({ phone: staffPhone });

        const newStaff = await AuthService.createInternalUser({
            name: 'New Staff',
            phone: staffPhone,
            password: 'password123',
            role: EUSERS_ROLE.STAFF
        }, updatedManager as any);

        console.log(`Staff created: ${newStaff.name} (Role: ${newStaff.role})`);

        // Verify staff assignment
        const verifiedStaff = await User.findById(newStaff._id);
        const updatedBranch = await Branch.findById(branch._id);

        if (verifiedStaff?.branch?.toString() === branch._id.toString() &&
            (verifiedStaff as any).assignedBranch?.toString() === branch._id.toString() &&
            updatedBranch?.staff.includes(verifiedStaff._id as any)) {
            console.log('PASS: Staff creation and branch sync successful.');
        } else {
            console.error('FAIL: Staff branch sync failed.');
            console.log('Staff Data:', JSON.stringify(verifiedStaff));
            console.log('Branch Staff:', updatedBranch?.staff);
        }

    } catch (err) {
        console.error('ERROR during verification:', err);
    } finally {
        console.log('--- Branch/Staff Management Verification End ---');
        await mongoose.disconnect();
    }
}

verify();
