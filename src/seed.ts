/**
 * Database Seed Script
 * Seeds the database with test data for Washy API
 * Re-running will flush collections and reseed
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Import models
import User from './models/user.model';
import Admin from './models/admin.model';
import Customer from './models/customer.model';
import Staff from './models/staff.model';
import Rider from './models/rider.model';
import BranchManager from './models/banch_manager.model';
import Branch from './models/branch.model';
import Service from './models/service.model';
import Order from './models/order.model';
import Payment from './models/payment.model';
import Notification from './models/notification.model';
import Preference from './models/preference.model';

// Import enums
import { 
  EUSERS_ROLE, 
  EPERMISSIONS, 
  ESERVICE_TYPE, 
  ESERVICE_CATEGORY,
  EGARMENT_TYPE 
} from './constants/enums.constant';
import { CONFIGS } from './constants/configs.constant';

// ============================================
// SEED DATA
// ============================================

// Kaduna, Nigeria Branch Locations (Real locations)
const branchesData = [
  {
    name: 'Washy Kaduna Main',
    code: 'KAD-001',
    address: {
      street: '15 Ahmadu Bello Way',
      area: 'Central Business District',
      city: 'Kaduna',
      state: 'Kaduna',
      coordinates: { lat: 10.5105, lng: 7.4165 }
    },
    coverageZones: [
      { name: 'Central Business District', state: 'Kaduna', coordinates: { lat: 10.5105, lng: 7.4165 } },
      { name: 'Sabon Gari', state: 'Kaduna', coordinates: { lat: 10.5203, lng: 7.4356 } },
      { name: 'Barnawa', state: 'Kaduna', coordinates: { lat: 10.4873, lng: 7.4298 } },
      { name: 'Tudun Wada', state: 'Kaduna', coordinates: { lat: 10.5089, lng: 7.4078 } }
    ],
    contactPhone: '+2348012345001',
    contactEmail: 'main@washy.com.ng',
    operatingHours: {
      monday: { open: '07:00', close: '20:00', isOpen: true },
      tuesday: { open: '07:00', close: '20:00', isOpen: true },
      wednesday: { open: '07:00', close: '20:00', isOpen: true },
      thursday: { open: '07:00', close: '20:00', isOpen: true },
      friday: { open: '07:00', close: '20:00', isOpen: true },
      saturday: { open: '08:00', close: '18:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: true }
    },
    capacity: { dailyOrderLimit: 150, currentDailyOrders: 0 }
  },
  {
    name: 'Washy Rigasa',
    code: 'KAD-002',
    address: {
      street: '23 Station Road',
      area: 'Rigasa',
      city: 'Kaduna',
      state: 'Kaduna',
      coordinates: { lat: 10.5667, lng: 7.3667 }
    },
    coverageZones: [
      { name: 'Rigasa', state: 'Kaduna', coordinates: { lat: 10.5667, lng: 7.3667 } },
      { name: 'Ungwan Rimi', state: 'Kaduna', coordinates: { lat: 10.5456, lng: 7.3989 } },
      { name: 'Kakuri', state: 'Kaduna', coordinates: { lat: 10.4714, lng: 7.4139 } },
      { name: 'Narayi', state: 'Kaduna', coordinates: { lat: 10.4522, lng: 7.4289 } }
    ],
    contactPhone: '+2348012345002',
    contactEmail: 'rigasa@washy.com.ng',
    operatingHours: {
      monday: { open: '08:00', close: '19:00', isOpen: true },
      tuesday: { open: '08:00', close: '19:00', isOpen: true },
      wednesday: { open: '08:00', close: '19:00', isOpen: true },
      thursday: { open: '08:00', close: '19:00', isOpen: true },
      friday: { open: '08:00', close: '19:00', isOpen: true },
      saturday: { open: '08:00', close: '17:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    capacity: { dailyOrderLimit: 100, currentDailyOrders: 0 }
  },
  {
    name: 'Washy Malali',
    code: 'KAD-003',
    address: {
      street: '8 Malali GRA Road',
      area: 'Malali',
      city: 'Kaduna',
      state: 'Kaduna',
      coordinates: { lat: 10.5389, lng: 7.4467 }
    },
    coverageZones: [
      { name: 'Malali', state: 'Kaduna', coordinates: { lat: 10.5389, lng: 7.4467 } },
      { name: 'Ungwan Sarki', state: 'Kaduna', coordinates: { lat: 10.5278, lng: 7.4589 } },
      { name: 'Television', state: 'Kaduna', coordinates: { lat: 10.5167, lng: 7.4656 } },
      { name: 'Ungwan Mu\'azu', state: 'Kaduna', coordinates: { lat: 10.5045, lng: 7.4512 } }
    ],
    contactPhone: '+2348012345003',
    contactEmail: 'malali@washy.com.ng',
    operatingHours: {
      monday: { open: '07:30', close: '19:30', isOpen: true },
      tuesday: { open: '07:30', close: '19:30', isOpen: true },
      wednesday: { open: '07:30', close: '19:30', isOpen: true },
      thursday: { open: '07:30', close: '19:30', isOpen: true },
      friday: { open: '07:30', close: '19:30', isOpen: true },
      saturday: { open: '08:00', close: '18:00', isOpen: true },
      sunday: { open: '12:00', close: '18:00', isOpen: true }
    },
    capacity: { dailyOrderLimit: 120, currentDailyOrders: 0 }
  }
];

// Services with pricing (Nigerian Naira)
const servicesData = [
  {
    name: 'Wash & Fold',
    slug: 'wash-and-fold',
    description: 'Professional washing and neatly folding service for your everyday clothes',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.WASH_AND_FOLD,
    pricing: [
      { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 200, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 250, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.DRESS, basePrice: 400, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.SKIRT, basePrice: 300, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.TOWEL, basePrice: 150, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.BEDSHEET, basePrice: 400, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.UNDERWEAR, basePrice: 100, expressMultiplier: 1.5 }
    ],
    estimatedDuration: { standard: 48, express: 24 },
    isExpressAvailable: true,
    sortOrder: 1
  },
  {
    name: 'Wash & Iron',
    slug: 'wash-and-iron',
    description: 'Complete washing with professional ironing for a crisp, ready-to-wear finish',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.WASH_AND_IRON,
    pricing: [
      { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 300, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 350, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.DRESS, basePrice: 500, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.SKIRT, basePrice: 400, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 600, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.JACKET, basePrice: 500, expressMultiplier: 1.5 }
    ],
    estimatedDuration: { standard: 48, express: 24 },
    isExpressAvailable: true,
    sortOrder: 2
  },
  {
    name: 'Dry Cleaning',
    slug: 'dry-cleaning',
    description: 'Premium dry cleaning for delicate fabrics, formal wear, and special garments',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.DRY_CLEAN,
    pricing: [
      { garmentType: EGARMENT_TYPE.SUIT, basePrice: 2500, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.DRESS, basePrice: 1500, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.JACKET, basePrice: 1800, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 2000, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.DUVET, basePrice: 3500, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.CURTAIN, basePrice: 2000, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.BLANKET, basePrice: 2500, expressMultiplier: 1.5 }
    ],
    estimatedDuration: { standard: 72, express: 48 },
    isExpressAvailable: true,
    sortOrder: 3
  },
  {
    name: 'Iron Only',
    slug: 'iron-only',
    description: 'Professional pressing service for already clean clothes',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.IRON_ONLY,
    pricing: [
      { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 150, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 150, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.DRESS, basePrice: 200, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.SKIRT, basePrice: 150, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 300, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.SUIT, basePrice: 400, expressMultiplier: 1.5 }
    ],
    estimatedDuration: { standard: 24, express: 6 },
    isExpressAvailable: true,
    sortOrder: 4
  },
  {
    name: 'Starch & Iron',
    slug: 'starch-and-iron',
    description: 'Traditional starching service for native attires and formal wear',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.STARCH,
    pricing: [
      { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 800, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 400, expressMultiplier: 1.5 },
      { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 400, expressMultiplier: 1.5 }
    ],
    estimatedDuration: { standard: 48, express: 24 },
    isExpressAvailable: true,
    sortOrder: 5
  },
  {
    name: 'Express Service',
    slug: 'express-service',
    description: 'Same-day or next-day rush service for urgent laundry needs',
    category: ESERVICE_CATEGORY.LAUNDRY,
    serviceType: ESERVICE_TYPE.EXPRESS,
    pricing: [
      { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 450, expressMultiplier: 1 },
      { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 500, expressMultiplier: 1 },
      { garmentType: EGARMENT_TYPE.DRESS, basePrice: 700, expressMultiplier: 1 },
      { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 900, expressMultiplier: 1 },
      { garmentType: EGARMENT_TYPE.SUIT, basePrice: 3500, expressMultiplier: 1 }
    ],
    estimatedDuration: { standard: 12, express: 6 },
    isExpressAvailable: false, // Already express
    sortOrder: 6
  }
];

// Users data (one per role)
const usersData = {
  superAdmin: {
    name: 'Super Admin User',
    email: 'superadmin@washy.com.ng',
    phone: '+2348100000001',
    password: 'SuperAdmin@123',
    role: EUSERS_ROLE.SUPER_ADMIN
  },
  admin: {
    name: 'Admin User',
    email: 'admin@washy.com.ng',
    phone: '+2348100000002',
    password: 'Admin@123456',
    role: EUSERS_ROLE.ADMIN
  },
  branchManager: {
    name: 'Musa Ibrahim',
    email: 'manager@washy.com.ng',
    phone: '+2348100000003',
    password: 'Manager@123',
    role: EUSERS_ROLE.BRANCH_MANAGER
  },
  staff: {
    name: 'Fatima Yusuf',
    email: 'staff@washy.com.ng',
    phone: '+2348100000004',
    password: 'Staff@12345',
    role: EUSERS_ROLE.STAFF
  },
  rider: {
    name: 'Abdullahi Sani',
    email: 'rider@washy.com.ng',
    phone: '+2348100000005',
    password: 'Rider@12345',
    role: EUSERS_ROLE.RIDER
  },
  customer: {
    name: 'Amina Mohammed',
    email: 'customer@example.com',
    phone: '+2348100000006',
    password: 'Customer@123',
    role: EUSERS_ROLE.CUSTOMER
  }
};

// ============================================
// SEED FUNCTIONS
// ============================================

async function connectDB() {
  const mongoUri = CONFIGS.MONGODB.URL;
  console.log('🔌 Connecting to MongoDB...');
  console.log(`   URI: ${mongoUri.replace(/\/\/.*:.*@/, '//<credentials>@')}`);
  
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB Connected');
}

async function clearCollections() {
  console.log('\n🧹 Clearing all collections...');
  
  const collections: { model: mongoose.Model<any>; name: string }[] = [
    { model: Order, name: 'Orders' },
    { model: Payment, name: 'Payments' },
    { model: Notification, name: 'Notifications' },
    { model: Preference, name: 'Preferences' },
    { model: Service, name: 'Services' },
    { model: Branch, name: 'Branches' },
    { model: User, name: 'Users (all types)' }
  ];
  
  for (const { model, name } of collections) {
    const count = await model.countDocuments();
    await model.deleteMany({});
    console.log(`   ✓ Cleared ${name}: ${count} documents removed`);
  }
}

async function seedBranches() {
  console.log('\n🏢 Seeding Branches...');
  
  const branches = [];
  for (const branchData of branchesData) {
    const branch = await Branch.create(branchData);
    branches.push(branch);
    console.log(`   ✓ Created branch: ${branch.name} (${branch.code})`);
  }
  
  return branches;
}

async function seedServices() {
  console.log('\n🧺 Seeding Services...');
  
  const services = [];
  for (const serviceData of servicesData) {
    const service = await Service.create(serviceData);
    services.push(service);
    console.log(`   ✓ Created service: ${service.name} (${service.pricing.length} price items)`);
  }
  
  return services;
}

async function seedUsers(branches: any[]) {
  console.log('\n👥 Seeding Users...');
  
  const salt = await bcrypt.genSalt(10);
  const users: Record<string, any> = {};
  
  // Super Admin
  const superAdminHash = await bcrypt.hash(usersData.superAdmin.password, salt);
  users.superAdmin = await Admin.create({
    name: usersData.superAdmin.name,
    email: usersData.superAdmin.email,
    phone: usersData.superAdmin.phone,
    passwordHash: superAdminHash,
    role: EUSERS_ROLE.SUPER_ADMIN,
    isSuperAdmin: true,
    permissions: Object.values(EPERMISSIONS)
  });
  console.log(`   ✓ Created Super Admin: ${users.superAdmin.name}`);
  
  // Admin
  const adminHash = await bcrypt.hash(usersData.admin.password, salt);
  users.admin = await Admin.create({
    name: usersData.admin.name,
    email: usersData.admin.email,
    phone: usersData.admin.phone,
    passwordHash: adminHash,
    role: EUSERS_ROLE.ADMIN,
    isSuperAdmin: false,
    permissions: Object.values(EPERMISSIONS).filter(p => 
      p !== EPERMISSIONS.DELETE_BRANCHES && p !== EPERMISSIONS.MANAGE_ADMINS
    )
  });
  console.log(`   ✓ Created Admin: ${users.admin.name}`);
  
  // Branch Manager (assigned to first branch)
  const managerHash = await bcrypt.hash(usersData.branchManager.password, salt);
  users.branchManager = await BranchManager.create({
    name: usersData.branchManager.name,
    email: usersData.branchManager.email,
    phone: usersData.branchManager.phone,
    passwordHash: managerHash,
    role: EUSERS_ROLE.BRANCH_MANAGER,
    managedBranch: branches[0]._id,
    permissions: [
      EPERMISSIONS.CREATE_ORDER,
      EPERMISSIONS.VIEW_ORDERS,
      EPERMISSIONS.UPDATE_ORDER_STATUS,
      EPERMISSIONS.MANAGE_CUSTOMERS,
      EPERMISSIONS.MANAGE_STAFF,
      EPERMISSIONS.VIEW_REPORTS,
      EPERMISSIONS.MANAGE_PICKUP_DELIVERY,
      EPERMISSIONS.SEND_NOTIFICATIONS
    ],
    targets: {
      monthlyOrderTarget: 500,
      monthlyRevenueTarget: 2000000
    }
  });
  // Update branch with manager
  await Branch.findByIdAndUpdate(branches[0]._id, { manager: users.branchManager._id });
  console.log(`   ✓ Created Branch Manager: ${users.branchManager.name} → ${branches[0].name}`);
  
  // Staff (assigned to first branch)
  const staffHash = await bcrypt.hash(usersData.staff.password, salt);
  users.staff = await Staff.create({
    name: usersData.staff.name,
    email: usersData.staff.email,
    phone: usersData.staff.phone,
    passwordHash: staffHash,
    role: EUSERS_ROLE.STAFF,
    assignedBranch: branches[0]._id,
    jobTitle: 'Laundry Attendant',
    permissions: [
      EPERMISSIONS.CREATE_ORDER,
      EPERMISSIONS.VIEW_ORDERS,
      EPERMISSIONS.UPDATE_ORDER_STATUS
    ]
  });
  // Add staff to branch
  await Branch.findByIdAndUpdate(branches[0]._id, { $push: { staff: users.staff._id } });
  console.log(`   ✓ Created Staff: ${users.staff.name} → ${branches[0].name}`);
  
  // Rider (assigned to first branch, covers its zones)
  const riderHash = await bcrypt.hash(usersData.rider.password, salt);
  users.rider = await Rider.create({
    name: usersData.rider.name,
    email: usersData.rider.email,
    phone: usersData.rider.phone,
    passwordHash: riderHash,
    role: EUSERS_ROLE.RIDER,
    assignedBranch: branches[0]._id,
    coverageZones: branches[0].coverageZones.map((z: any) => z.name),
    vehicleType: 'motorcycle',
    vehiclePlateNumber: 'KAD-234-XY',
    isAvailable: true,
    isOnDuty: true,
    currentLocation: {
      lat: 10.5105,    // Kaduna CBD latitude
      lng: 7.4165,     // Kaduna CBD longitude
      updatedAt: new Date()
    }
  });
  // Add rider to branch
  await Branch.findByIdAndUpdate(branches[0]._id, { $push: { riders: users.rider._id } });
  console.log(`   ✓ Created Rider: ${users.rider.name} → ${branches[0].name}`);
  
  // Customer
  const customerHash = await bcrypt.hash(usersData.customer.password, salt);
  users.customer = await Customer.create({
    name: usersData.customer.name,
    email: usersData.customer.email,
    phone: usersData.customer.phone,
    passwordHash: customerHash,
    role: EUSERS_ROLE.CUSTOMER,
    address: {
      street: '42 Independence Way',
      area: 'Barnawa',
      city: 'Kaduna',
      state: 'Kaduna',
      landmark: 'Near Barnawa Market'
    }
  });
  console.log(`   ✓ Created Customer: ${users.customer.name}`);
  
  return users;
}

async function printSummary(branches: any[], services: any[], users: Record<string, any>) {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SEED SUMMARY');
  console.log('═'.repeat(60));
  
  console.log(`\n🏢 Branches: ${branches.length}`);
  branches.forEach(b => console.log(`   • ${b.name} (${b.code}) - ${b.coverageZones.length} zones`));
  
  console.log(`\n🧺 Services: ${services.length}`);
  services.forEach(s => console.log(`   • ${s.name} - ₦${s.pricing[0].basePrice} starting`));
  
  console.log('\n👥 Users:');
  console.log(`   • Super Admin: ${users.superAdmin.email} / ${usersData.superAdmin.password}`);
  console.log(`   • Admin: ${users.admin.email} / ${usersData.admin.password}`);
  console.log(`   • Branch Manager: ${users.branchManager.email} / ${usersData.branchManager.password}`);
  console.log(`   • Staff: ${users.staff.email} / ${usersData.staff.password}`);
  console.log(`   • Rider: ${users.rider.email} / ${usersData.rider.password}`);
  console.log(`   • Customer: ${users.customer.email} / ${usersData.customer.password}`);
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Database seeded successfully!');
  console.log('═'.repeat(60) + '\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function seed() {
  try {
    console.log('\n🌱 WASHY DATABASE SEEDER');
    console.log('═'.repeat(60));
    console.log('This script will CLEAR all existing data and seed fresh data.');
    console.log('═'.repeat(60));
    
    await connectDB();
    await clearCollections();
    
    const branches = await seedBranches();
    const services = await seedServices();
    const users = await seedUsers(branches);
    
    await printSummary(branches, services, users);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
