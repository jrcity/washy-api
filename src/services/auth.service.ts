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