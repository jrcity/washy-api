/**
 * Branch Validation Schemas
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';
import { NIGERIA_PHONE_REGEX } from '@/utils/regex.util';

// Operating hours schema
const operatingHoursSchema = z.object({
  open: z.string().default('08:00'),
  close: z.string().default('18:00'),
  isOpen: z.boolean().default(true)
});

// Coverage zone schema
const coverageZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  state: z.string().default('Lagos'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

// Create branch validation
export const createBranchValidation = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  code: z.string().min(3, 'Branch code must be at least 3 characters').optional(),
  address: z.object({
    street: z.string().min(3, 'Street is required'),
    area: z.string().min(2, 'Area is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().default('Lagos'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  coverageZones: z.array(coverageZoneSchema).optional(),
  manager: z.string().optional(),
  contactPhone: z.string().regex(NIGERIA_PHONE_REGEX, 'Invalid Nigerian phone number'),
  contactEmail: z.string().email('Invalid email address'),
  operatingHours: z.object({
    monday: operatingHoursSchema.optional(),
    tuesday: operatingHoursSchema.optional(),
    wednesday: operatingHoursSchema.optional(),
    thursday: operatingHoursSchema.optional(),
    friday: operatingHoursSchema.optional(),
    saturday: operatingHoursSchema.optional(),
    sunday: operatingHoursSchema.optional()
  }).optional(),
  capacity: z.object({
    dailyOrderLimit: z.number().min(1).default(100)
  }).optional()
});

// Update branch validation
export const updateBranchValidation = createBranchValidation.partial();

// Add coverage zone validation
export const addCoverageZoneValidation = z.object({
  zones: z.array(coverageZoneSchema).min(1, 'At least one zone is required')
});

// Assign manager validation
export const assignManagerValidation = z.object({
  managerId: z.string().min(1, 'Manager ID is required')
});

// Assign staff/rider validation
export const assignStaffValidation = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['staff', 'rider'])
});

// Branch query validation
export const branchQueryValidation = z.object({
  isActive: z.string().transform(val => val === 'true').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10)
});

export default {
  createBranchValidation,
  updateBranchValidation,
  addCoverageZoneValidation,
  assignManagerValidation,
  assignStaffValidation,
  branchQueryValidation
};
