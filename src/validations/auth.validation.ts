import { z } from 'zod';
import { EUSERS_ROLE } from '@/constants/enums.constant';
import { NIGERIA_PHONE_REGEX, PASSWORD_REGEX } from '@/utils/regex.util';

// Validation for Registration
export const registerValidation = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number is too short").regex(NIGERIA_PHONE_REGEX, "Phone number must be a valid Nigerian phone number"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(PASSWORD_REGEX, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    role: z.enum([
        EUSERS_ROLE.CUSTOMER,
        EUSERS_ROLE.ADMIN,
        EUSERS_ROLE.SUPER_ADMIN,
        EUSERS_ROLE.BRANCH_MANAGER,
        EUSERS_ROLE.STAFF,
        EUSERS_ROLE.RIDER
    ] as const).default(EUSERS_ROLE.CUSTOMER),
    email: z.email().optional(),
});

// Validation for Login
export const loginValidation = z.object({
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(1, "Password is required"),
});

// Validation for Password Reset Request
export const requestPasswordResetValidation = z.object({
    phone: z.string().min(10, "Phone number is too short").regex(NIGERIA_PHONE_REGEX, "Invalid Nigerian phone number"),
});

// Validation for Password Reset
export const resetPasswordValidation = z.object({
    phone: z.string().min(10),
    otp: z.string().length(4, "OTP must be 4 digits"),
    newPassword: z.string().min(8).regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, number, and special character"),
});

// Validation for Change Password
export const changePasswordValidation = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8).regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, number, and special character"),
});

// Validation for updating push token
export const updatePushTokenValidation = z.object({
    pushToken: z.string().min(1, "Push token is required"),
});

export default {
    registerValidation,
    loginValidation,
    requestPasswordResetValidation,
    resetPasswordValidation,
    changePasswordValidation,
    updatePushTokenValidation
};