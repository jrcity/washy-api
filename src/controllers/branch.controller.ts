/**
 * Branch Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import BranchService from '@/services/branch.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.createBranch(req.body);
  return ResponseHandler.created(res, branch, 'Branch created successfully');
});

export const getBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.getBranchById(req.params.id as string);
  return ResponseHandler.success(res, branch);
});

export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const result = await BranchService.getBranches({
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    city: req.query.city as string,
    state: req.query.state as string,
    zone: req.query.zone as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10
  });
  return ResponseHandler.paginated(res, result.branches,
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.updateBranch(req.params.id as string, req.body);
  return ResponseHandler.success(res, branch, 'Branch updated');
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  await BranchService.deleteBranch(req.params.id as string);
  return ResponseHandler.noContent(res);
});

export const assignManager = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.assignManager(req.params.id as string, req.body.managerId);
  return ResponseHandler.success(res, branch, 'Manager assigned');
});

export const addCoverageZones = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.addCoverageZones(req.params.id as string, req.body.zones);
  return ResponseHandler.success(res, branch, 'Coverage zones added');
});

export const assignStaff = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.assignStaffToBranch(req.params.id as string, req.body.userId, req.body.type);
  return ResponseHandler.success(res, branch, 'Staff assigned');
});

export const getBranchStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await BranchService.getBranchStats(req.params.id as string);
  return ResponseHandler.success(res, stats);
});

export const findByZone = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.findBranchByZone(
    req.query.zone as string || '',
    req.query.state as string || 'Lagos'
  );
  return ResponseHandler.success(res, branch);
});

export default {
  createBranch, getBranch, getBranches, updateBranch, deleteBranch,
  assignManager, addCoverageZones, assignStaff, getBranchStats, findByZone
};
