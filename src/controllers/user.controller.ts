/**
 * User Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import UserService from '@/services/user.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { EUSERS_ROLE } from '@/constants/enums.constant';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    role: req.query.role as EUSERS_ROLE,
    search: req.query.search as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sort: req.query.sort as string
  };
  
  const result = await UserService.getUsers(filters);
  return ResponseHandler.paginated(res, result.users, 
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id);
  return ResponseHandler.success(res, user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  return ResponseHandler.success(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await UserService.deleteUser(req.params.id);
  return ResponseHandler.success(res, null, 'User deleted successfully');
});

export default {
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
