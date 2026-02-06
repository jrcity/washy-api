/**
 * AuthService
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import bcrypt from 'bcryptjs';
import User, { IUser } from '@/models/user.model';
import Admin from '@/models/admin.model';
import Customer from '@/models/customer.model';
import Staff from '@/models/staff.model';
import Rider from '@/models/rider.model';
import BranchManager from '@/models/banch_manager.model';
import { z } from 'zod';
import { registerValidation, loginValidation } from '@/validations/auth.validation';
import { AppError } from '@/utils/error.util';
import { tokenService } from '@/utils/token.util';
import { EUSERS_ROLE } from '@/constants/enums.constant';
import { createInternalUserValidation, CreateInternalUserInput } from '@/validations/user.validation';

// Define types based on Zod schemas
type RegisterInput = z.infer<typeof registerValidation>;
type LoginInput = z.infer<typeof loginValidation>;

interface AuthResponse {
  user: Partial<IUser>;
  accessToken: string;
  refreshToken: string;
}

class AuthService {

  // 1. REGISTER LOGIC
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if user exists (Phone - primary identifier for Nigeria)
    const existingUser = await User.findOne({
      $or: [
        { phone: data.phone },
        ...(data.email ? [{ email: data.email }] : [])
      ]
    });

    if (existingUser) {
      throw AppError.conflict('User with this phone or email already exists');
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create User based on role
    let newUser: IUser;
    const role = data.role || EUSERS_ROLE.CUSTOMER;

    const baseUserData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: passwordHash,
      role: role
    };

    switch (role) {
      case EUSERS_ROLE.ADMIN:
      case EUSERS_ROLE.SUPER_ADMIN:
        newUser = await Admin.create({
          ...baseUserData,
          isSuperAdmin: role === EUSERS_ROLE.SUPER_ADMIN
        });
        break;

      case EUSERS_ROLE.BRANCH_MANAGER:
        newUser = await BranchManager.create(baseUserData);
        break;

      case EUSERS_ROLE.STAFF:
        newUser = await Staff.create(baseUserData);
        break;

      case EUSERS_ROLE.RIDER:
        newUser = await Rider.create(baseUserData);
        break;

      case EUSERS_ROLE.CUSTOMER:
      default:
        newUser = await Customer.create(baseUserData);
        break;
    }

    return this.generateAuthResponse(newUser);
  }

  // 1.1 CREATE INTERNAL USER (Staff/Rider/BranchManager by Admin/Manager)
  async createInternalUser(data: CreateInternalUserInput, creator: IUser): Promise<IUser> {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { phone: data.phone },
        ...(data.email ? [{ email: data.email }] : [])
      ]
    });

    if (existingUser) {
      throw AppError.conflict('User with this phone or email already exists');
    }

    // Determine branch
    let branchId = data.branch;

    // If creator is a Branch Manager, they can only create for their own branch
    if (creator.role === EUSERS_ROLE.BRANCH_MANAGER) {
      const managerBranch = (creator as any).managedBranch || creator.branch;
      if (!managerBranch) {
        throw AppError.forbidden('Branch manager must be assigned to a branch to create staff');
      }
      branchId = managerBranch.toString();
    } else if (!branchId && (creator.role === EUSERS_ROLE.ADMIN || creator.role === EUSERS_ROLE.SUPER_ADMIN)) {
      // Admins should provide a branch, but let's allow optional if they really want unassigned (though unlikely for staff)
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const baseUserData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: passwordHash,
      role: data.role,
      branch: branchId
    };

    let newUser: IUser;
    switch (data.role) {
      case EUSERS_ROLE.BRANCH_MANAGER:
        newUser = await BranchManager.create({
          ...baseUserData,
          managedBranch: branchId
        });
        break;

      case EUSERS_ROLE.STAFF:
        newUser = await Staff.create({
          ...baseUserData,
          assignedBranch: branchId
        });
        break;

      case EUSERS_ROLE.RIDER:
        newUser = await Rider.create({
          ...baseUserData,
          assignedBranch: branchId
        });
        break;

      default:
        throw AppError.badRequest(`Cannot create user with role ${data.role} via this endpoint`);
    }

    // If a branch was specified, we should ALSO update the Branch model to include this user
    // This part is tricky because Branch model has 'staff' and 'riders' arrays
    // We'll import BranchService to handle the bidirectional link correctly
    if (branchId) {
      const branchService = (await import('./branch.service')).default;
      const userId = (newUser._id as any).toString();
      if (data.role === EUSERS_ROLE.STAFF) {
        await branchService.assignStaffToBranch(branchId, userId, 'staff');
      } else if (data.role === EUSERS_ROLE.RIDER) {
        await branchService.assignStaffToBranch(branchId, userId, 'rider');
      } else if (data.role === EUSERS_ROLE.BRANCH_MANAGER) {
        await branchService.assignManager(branchId, userId);
      }
    }

    return newUser;
  }

  // 2. LOGIN LOGIC
  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await User.findOne({ phone: data.phone });
    if (!user) {
      throw AppError.unauthorized('Invalid phone number or password');
    }

    // Compare Password
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid phone number or password');
    }

    return this.generateAuthResponse(user);
  }

  // 3. REFRESH TOKEN
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw AppError.unauthorized('User not found');
      }

      const accessToken = tokenService.generateAccessToken({
        id: user._id,
        role: user.role
      });

      return { accessToken };
    } catch (error) {
      throw AppError.unauthorized('Invalid refresh token');
    }
  }

  // 4. UPDATE PUSH TOKEN
  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { pushToken });
  }

  // 5. LOGOUT (remove push token)
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $unset: { pushToken: 1 },
      $set: { tokens: [] }
    });
  }

  // HELPER: Generate Token & Clean User Object
  private generateAuthResponse(user: IUser): AuthResponse {
    const { accessToken, refreshToken } = tokenService.generateTokens({
      id: user._id,
      role: user.role
    });

    // Return user data WITHOUT sensitive fields
    const userObject = user.toObject();
    const { passwordHash, tokens, __v, ...cleanUser } = userObject;

    return {
      user: cleanUser,
      accessToken,
      refreshToken,
    };
  }
}

export default new AuthService();