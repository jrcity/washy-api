/**
 * Branch Service
 * Business logic for branch management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Branch, { IBranch, ICoverageZone } from '@/models/branch.model';
import User from '@/models/user.model';
import { AppError } from '@/utils/error.util';
import { EUSERS_ROLE } from '@/constants/enums.constant';
import { BRANCH_CODE_REGEX } from '@/utils';

interface CreateBranchInput {
  name: string;
  code?: string;
  address: {
    street: string;
    area: string;
    city: string;
    state?: string;
    coordinates?: { lat: number; lng: number };
  };
  coverageZones?: ICoverageZone[];
  manager?: string;
  contactPhone: string;
  contactEmail: string;
  operatingHours?: any;
  capacity?: { dailyOrderLimit: number };
}

class BranchService {

  /**
   * Create a new branch
   */
  async createBranch(input: CreateBranchInput): Promise<IBranch> {
    // Generate branch code if not provided
    const code = input.code || await this.generateBranchCode(input.name);

    // Validate branch code
    if (!BRANCH_CODE_REGEX.test(code)) {
      throw AppError.badRequest('Invalid branch code format');
    }

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      throw AppError.conflict('Branch code already exists');
    }

    const branch = await Branch.create({
      ...input,
      code
    });

    // If manager is assigned, update the branch manager reference
    if (input.manager) {
      await this.assignManager(branch._id.toString(), input.manager);
    }

    return branch;
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId: string): Promise<IBranch> {
    const branch = await Branch.findById(branchId)
      .populate('manager', 'name email phone')
      .populate('staff', 'name email phone')
      .populate('riders', 'name phone');

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return branch;
  }

  /**
   * Get all branches with filters
   */
  async getBranches(filters: {
    isActive?: boolean;
    city?: string;
    state?: string;
    zone?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.city) query['address.city'] = new RegExp(filters.city, 'i');
    if (filters.state) query['address.state'] = new RegExp(filters.state, 'i');
    if (filters.zone) {
      query['coverageZones.name'] = new RegExp(filters.zone, 'i');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [branches, total] = await Promise.all([
      Branch.find(query)
        .populate('manager', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Branch.countDocuments(query)
    ]);

    return {
      branches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update branch
   */
  async updateBranch(
    branchId: string,
    updates: Partial<CreateBranchInput>
  ): Promise<IBranch> {

    // Reject update if branch code is changed
    if (updates.code) {
      throw AppError.badRequest('Branch code cannot be changed');
    }

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('manager', 'name email phone');

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return branch;
  }

  /**
   * Delete branch (soft delete by deactivating)
   */
  async deleteBranch(branchId: string): Promise<void> {
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { isActive: false },
      { new: true }
    );

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }
  }

  /**
   * Assign manager to branch
   */
  async assignManager(branchId: string, managerId: string): Promise<IBranch> {
    // Verify user exists and has manager role
    const manager = await User.findById(managerId);
    if (!manager) {
      throw AppError.notFound('Manager not found');
    }

    if (
      manager.role !== EUSERS_ROLE.BRANCH_MANAGER &&
      manager.role !== EUSERS_ROLE.ADMIN &&
      manager.role !== EUSERS_ROLE.SUPER_ADMIN
    ) {
      throw AppError.badRequest('User is not a branch manager');
    }

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { manager: managerId },
      { new: true }
    ).populate('manager', 'name email phone');

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    // Sync back to user - update both canonical 'branch' and specialized 'managedBranch'
    await User.findByIdAndUpdate(managerId, {
      branch: branchId,
      managedBranch: branchId
    });

    return branch;
  }

  /**
   * Add coverage zones to branch
   */
  async addCoverageZones(
    branchId: string,
    zones: ICoverageZone[]
  ): Promise<IBranch> {
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $push: { coverageZones: { $each: zones } } },
      { new: true }
    );

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return branch;
  }

  /**
   * Remove coverage zone from branch
   */
  async removeCoverageZone(
    branchId: string,
    zoneName: string
  ): Promise<IBranch> {
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $pull: { coverageZones: { name: zoneName } } },
      { new: true }
    );

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return branch;
  }

  /**
   * Find branch by coverage zone
   */
  async findBranchByZone(
    zoneName: string,
    state: string = 'Lagos'
  ): Promise<IBranch | null> {
    return Branch.findOne({
      isActive: true,
      coverageZones: {
        $elemMatch: {
          name: { $regex: new RegExp(zoneName, 'i') },
          state: { $regex: new RegExp(state, 'i') }
        }
      }
    });
  }

  /**
   * Assign staff or rider to branch
   */
  async assignStaffToBranch(
    branchId: string,
    userId: string,
    type: 'staff' | 'rider'
  ): Promise<IBranch> {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const updateField = type === 'staff' ? 'staff' : 'riders';

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $addToSet: { [updateField]: userId } },
      { new: true }
    )
      .populate('staff', 'name email phone')
      .populate('riders', 'name phone');

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    // Sync back to user - update both canonical 'branch' and specialized 'assignedBranch'
    await User.findByIdAndUpdate(userId, {
      branch: branchId,
      assignedBranch: branchId
    });

    return branch;
  }

  /**
   * Remove staff or rider from branch
   */
  async removeStaffFromBranch(
    branchId: string,
    userId: string,
    type: 'staff' | 'rider'
  ): Promise<IBranch> {
    const updateField = type === 'staff' ? 'staff' : 'riders';

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $pull: { [updateField]: userId } },
      { new: true }
    )
      .populate('staff', 'name email phone')
      .populate('riders', 'name phone');

    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    // Sync back to user - clear both branch fields
    await User.findByIdAndUpdate(userId, {
      $unset: { branch: 1, assignedBranch: 1, managedBranch: 1 }
    });

    return branch;
  }

  /**
   * Get branch statistics
   */
  async getBranchStats(branchId: string) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return {
      totalOrders: branch.metrics.totalOrders,
      totalRevenue: branch.metrics.totalRevenue,
      averageRating: branch.metrics.averageRating,
      totalReviews: branch.metrics.totalReviews,
      currentDailyOrders: branch.capacity.currentDailyOrders,
      dailyOrderLimit: branch.capacity.dailyOrderLimit,
      utilizationRate: (
        (branch.capacity.currentDailyOrders / branch.capacity.dailyOrderLimit) * 100
      ).toFixed(2) + '%'
    };
  }

  /**
   * Check if branch is open
   */
  async isBranchOpen(branchId: string): Promise<boolean> {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw AppError.notFound('Branch not found');
    }

    return (branch as any).isOpenNow();
  }

  /**
   * Reset daily order count (for cron job)
   */
  async resetDailyOrderCounts(): Promise<void> {
    await Branch.updateMany(
      {},
      { $set: { 'capacity.currentDailyOrders': 0 } }
    );
  }

  /**
   * Generate branch code
   */
  private async generateBranchCode(name: string): Promise<string> {
    // Take first 3 letters of branch name
    const prefix = name.substring(0, 3).toUpperCase();

    // Count existing branches with same prefix
    const count = await Branch.countDocuments({
      code: { $regex: `^${prefix}` }
    });

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}

export default new BranchService();
