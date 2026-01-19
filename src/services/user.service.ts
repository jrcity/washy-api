/**
 * User Service
 * Business logic for user management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import User, { IUser } from '@/models/user.model';
import { AppError } from '@/utils/error.util';
import { EUSERS_ROLE } from '@/constants/enums.constant';

class UserService {
  
  /**
   * Get users with pagination and filters
   */
  async getUsers(filters: {
    role?: EUSERS_ROLE;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const query: any = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const sort = filters.sort || '-createdAt';
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }
  
  /**
   * Update user
   */
  async updateUser(userId: string, data: Partial<IUser>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Prevent role updates via this generic method (should be admin only dedicated route if needed)
    if (data.role) {
      delete data.role;
    }
    
    // Update fields
    Object.assign(user, data);
    await user.save();
    
    return User.findById(userId).select('-password') as unknown as IUser;
  }
  
  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Soft delete or hard delete? Usually hard delete for this context, or deactivate
    // For now implementing hard delete
    await User.findByIdAndDelete(userId);
  }
}

export default new UserService();
