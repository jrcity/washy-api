/**
 * RBAC Service
 * Policy management and evaluation
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import RBACPolicy, { IRBACPolicy, IRBACCondition } from '@/models/rbac-policy.model';
import { AppError } from '@/utils/error.util';
import { EUSERS_ROLE, ERBAC_ACTION, ERBAC_OPERATOR } from '@/constants/enums.constant';

interface CreatePolicyInput {
    name: string;
    description?: string;
    resource: string;
    action: ERBAC_ACTION;
    roles: EUSERS_ROLE[];
    conditions: IRBACCondition[];
    conditionLogic?: 'AND' | 'OR';
    priority?: number;
    createdBy: string;
}

interface PolicyContext {
    user: {
        _id: string;
        role: EUSERS_ROLE;
        branch?: string;
        [key: string]: any;
    };
    resource?: any;
    request?: any;
}

class RBACService {
    /**
     * Create a new RBAC policy
     */
    async createPolicy(input: CreatePolicyInput): Promise<IRBACPolicy> {
        // Check for duplicate name
        const existing = await RBACPolicy.findOne({ name: input.name });
        if (existing) {
            throw AppError.conflict('Policy with this name already exists');
        }

        const policy = await RBACPolicy.create({
            ...input,
            createdBy: new Types.ObjectId(input.createdBy)
        });

        return policy;
    }

    /**
     * Get all policies
     */
    async getPolicies(filters?: { resource?: string; action?: ERBAC_ACTION; isActive?: boolean }) {
        const query: any = {};
        if (filters?.resource) query.resource = filters.resource;
        if (filters?.action) query.action = filters.action;
        if (filters?.isActive !== undefined) query.isActive = filters.isActive;

        return RBACPolicy.find(query)
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .sort({ priority: -1, createdAt: -1 });
    }

    /**
     * Get policy by ID
     */
    async getPolicyById(policyId: string): Promise<IRBACPolicy> {
        const policy = await RBACPolicy.findById(policyId)
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        if (!policy) {
            throw AppError.notFound('Policy not found');
        }

        return policy;
    }

    /**
     * Update policy
     */
    async updatePolicy(policyId: string, updates: Partial<CreatePolicyInput>, updatedBy: string): Promise<IRBACPolicy> {
        const policy = await RBACPolicy.findByIdAndUpdate(
            policyId,
            { ...updates, updatedBy: new Types.ObjectId(updatedBy) },
            { new: true }
        );

        if (!policy) {
            throw AppError.notFound('Policy not found');
        }

        return policy;
    }

    /**
     * Delete policy
     */
    async deletePolicy(policyId: string): Promise<void> {
        const result = await RBACPolicy.findByIdAndDelete(policyId);
        if (!result) {
            throw AppError.notFound('Policy not found');
        }
    }

    /**
     * Toggle policy active status
     */
    async togglePolicyStatus(policyId: string, updatedBy: string): Promise<IRBACPolicy> {
        const policy = await RBACPolicy.findById(policyId);
        if (!policy) {
            throw AppError.notFound('Policy not found');
        }

        policy.isActive = !policy.isActive;
        policy.updatedBy = new Types.ObjectId(updatedBy);
        await policy.save();

        return policy;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(condition: IRBACCondition, context: PolicyContext): boolean {
        let fieldValue: any;
        let compareValue = condition.value;

        // Get field value from resource or context
        if (condition.field.startsWith('user.')) {
            fieldValue = this.getNestedValue(context.user, condition.field.substring(5));
        } else if (condition.field.startsWith('resource.')) {
            fieldValue = this.getNestedValue(context.resource, condition.field.substring(9));
        } else {
            fieldValue = this.getNestedValue(context.resource, condition.field);
        }

        // If valueField is specified, get compare value from context
        if (condition.valueField) {
            if (condition.valueField.startsWith('user.')) {
                compareValue = this.getNestedValue(context.user, condition.valueField.substring(5));
            } else if (condition.valueField.startsWith('request.')) {
                compareValue = this.getNestedValue(context.request, condition.valueField.substring(8));
            }
        }

        // Evaluate based on operator
        switch (condition.operator) {
            case ERBAC_OPERATOR.EQUALS:
                return String(fieldValue) === String(compareValue);
            case ERBAC_OPERATOR.NOT_EQUALS:
                return String(fieldValue) !== String(compareValue);
            case ERBAC_OPERATOR.GREATER_THAN:
                return Number(fieldValue) > Number(compareValue);
            case ERBAC_OPERATOR.LESS_THAN:
                return Number(fieldValue) < Number(compareValue);
            case ERBAC_OPERATOR.GREATER_THAN_OR_EQUALS:
                return Number(fieldValue) >= Number(compareValue);
            case ERBAC_OPERATOR.LESS_THAN_OR_EQUALS:
                return Number(fieldValue) <= Number(compareValue);
            case ERBAC_OPERATOR.IN:
                return Array.isArray(compareValue) && compareValue.includes(fieldValue);
            case ERBAC_OPERATOR.NOT_IN:
                return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
            case ERBAC_OPERATOR.CONTAINS:
                return String(fieldValue).includes(String(compareValue));
            case ERBAC_OPERATOR.STARTS_WITH:
                return String(fieldValue).startsWith(String(compareValue));
            case ERBAC_OPERATOR.ENDS_WITH:
                return String(fieldValue).endsWith(String(compareValue));
            case ERBAC_OPERATOR.IS_NULL:
                return fieldValue === null || fieldValue === undefined;
            case ERBAC_OPERATOR.IS_NOT_NULL:
                return fieldValue !== null && fieldValue !== undefined;
            case ERBAC_OPERATOR.MATCHES:
                return new RegExp(String(compareValue)).test(String(fieldValue));
            default:
                return false;
        }
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        if (!obj) return undefined;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Evaluate policy against context
     */
    evaluatePolicy(policy: IRBACPolicy, context: PolicyContext): boolean {
        if (!policy.isActive) return false;
        if (!policy.roles.includes(context.user.role)) return false;

        if (policy.conditions.length === 0) return true;

        const results = policy.conditions.map(condition =>
            this.evaluateCondition(condition, context)
        );

        return policy.conditionLogic === 'AND'
            ? results.every(r => r)
            : results.some(r => r);
    }

    /**
     * Check if user has access to resource
     */
    async checkAccess(
        resource: string,
        action: ERBAC_ACTION,
        context: PolicyContext
    ): Promise<{ allowed: boolean; policy?: IRBACPolicy }> {
        // Super admin always has access
        if (context.user.role === EUSERS_ROLE.SUPER_ADMIN) {
            return { allowed: true };
        }

        const policies = await RBACPolicy.find({
            resource,
            action,
            roles: context.user.role,
            isActive: true
        }).sort({ priority: -1 });

        for (const policy of policies) {
            if (this.evaluatePolicy(policy, context)) {
                return { allowed: true, policy };
            }
        }

        return { allowed: false };
    }

    /**
     * Get accessible query filter for a resource
     * Returns a MongoDB query that limits results to what user can access
     */
    async getAccessFilter(
        resource: string,
        context: PolicyContext
    ): Promise<any> {
        // Super admin can access everything
        if (context.user.role === EUSERS_ROLE.SUPER_ADMIN) {
            return {};
        }

        // Admin can access their branch data
        if (context.user.role === EUSERS_ROLE.ADMIN && context.user.branch) {
            return { branch: new Types.ObjectId(context.user.branch) };
        }

        // Branch manager and staff - limit to their branch
        if ([EUSERS_ROLE.BRANCH_MANAGER, EUSERS_ROLE.STAFF].includes(context.user.role) && context.user.branch) {
            return { branch: new Types.ObjectId(context.user.branch) };
        }

        // Customer - only their own data
        if (context.user.role === EUSERS_ROLE.CUSTOMER) {
            return { customer: new Types.ObjectId(context.user._id) };
        }

        // Rider - only their assigned tasks/orders
        if (context.user.role === EUSERS_ROLE.RIDER) {
            return {
                $or: [
                    { pickupRider: new Types.ObjectId(context.user._id) },
                    { deliveryRider: new Types.ObjectId(context.user._id) }
                ]
            };
        }

        // Default: return impossible query (no access)
        return { _id: null };
    }
}

export default new RBACService();
