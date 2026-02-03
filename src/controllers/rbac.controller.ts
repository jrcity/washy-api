/**
 * RBAC Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import rbacService from '@/services/rbac.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';

class RBACController {
    /**
     * Create policy
     */
    createPolicy = asyncHandler(async (req: Request, res: Response) => {
        const policy = await rbacService.createPolicy({
            ...req.body,
            createdBy: req.user!._id.toString()
        });
        return ResponseHandler.created(res, policy, 'Policy created successfully');
    });

    /**
     * Get all policies
     */
    getPolicies = asyncHandler(async (req: Request, res: Response) => {
        const policies = await rbacService.getPolicies({
            resource: req.query.resource as string | undefined,
            action: req.query.action as any,
            isActive: req.query.isActive === 'true'
        });
        return ResponseHandler.success(res, policies, 'Policies retrieved successfully');
    });

    /**
     * Get policy by ID
     */
    getPolicy = asyncHandler(async (req: Request, res: Response) => {
        const policy = await rbacService.getPolicyById(req.params.id as string);
        return ResponseHandler.success(res, policy, 'Policy retrieved successfully');
    });

    /**
     * Update policy
     */
    updatePolicy = asyncHandler(async (req: Request, res: Response) => {
        const policy = await rbacService.updatePolicy(
            req.params.id as string,
            req.body,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, policy, 'Policy updated successfully');
    });

    /**
     * Delete policy
     */
    deletePolicy = asyncHandler(async (req: Request, res: Response) => {
        await rbacService.deletePolicy(req.params.id as string);
        return ResponseHandler.success(res, null, 'Policy deleted successfully');
    });

    /**
     * Toggle policy status
     */
    toggleStatus = asyncHandler(async (req: Request, res: Response) => {
        const policy = await rbacService.togglePolicyStatus(
            req.params.id as string,
            req.user!._id.toString()
        );
        return ResponseHandler.success(res, policy, 'Policy status updated');
    });

    /**
     * Check access (for testing policies)
     */
    checkAccess = asyncHandler(async (req: Request, res: Response) => {
        const { resource, action, context } = req.body;
        const result = await rbacService.checkAccess(resource, action, {
            user: {
                _id: req.user!._id.toString(),
                role: req.user!.role,
                ...context?.user
            },
            resource: context?.resource,
            request: context?.request
        });
        return ResponseHandler.success(res, result, 'Access check completed');
    });
}

export default new RBACController();
