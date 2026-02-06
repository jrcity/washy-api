import { z } from 'zod';
import { EUSERS_ROLE } from '@/constants/enums.constant';
import { PASSWORD_REGEX } from '@/utils/regex.util';

export const createInternalUserValidation = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Invalid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(PASSWORD_REGEX, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    role: z.enum([EUSERS_ROLE.STAFF, EUSERS_ROLE.RIDER, EUSERS_ROLE.BRANCH_MANAGER]),
    branch: z.string().optional(), // Required if Admin, auto-filled if Manager
});

export type CreateInternalUserInput = z.infer<typeof createInternalUserValidation>;
