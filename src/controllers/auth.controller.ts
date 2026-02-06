/**
 * Auth Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import AuthService from '@/services/auth.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  return ResponseHandler.created(res, result, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  return ResponseHandler.success(res, result, 'Login successful');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  return ResponseHandler.success(res, req.user, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.updateProfile(req.user!._id.toString(), req.body);
  return ResponseHandler.success(res, user, 'Profile updated successfully');
});

export default { register, login, getProfile, updateProfile };
