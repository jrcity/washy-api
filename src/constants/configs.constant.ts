/**
 * Configuration constants for the Washy application
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import dotenv from 'dotenv';

dotenv.config();

export const CONFIGS = {
  APP: {
    NAME: process.env.APP_NAME || 'Washy API',
    PORT: Number(process.env.APP_PORT) || 3000,
    ENV: process.env.NODE_ENV || 'development',
    URL: process.env.APP_URL || 'http://localhost:5173',
  },
  MONGODB: {
    URL: process.env.MONGODB_URL || '',
    HOST: process.env.MONGODB_HOST || 'localhost',
    PORT: Number(process.env.MONGODB_PORT) || 27017,
    USER: process.env.MONGODB_USER || '',
    PASSWORD: process.env.MONGODB_PASSWORD || '',
    NAME: process.env.MONGODB_NAME || 'washy_db',
  },
  CORS: [
    "http://localhost:4173",
    "http://localhost:5174",
    "http://localhost:5173",
    "https://washy.vercel.app",
    "https://washy.netlify.app",
  ],
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    FOLDER: process.env.CLOUDINARY_FOLDER || 'washy',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_change_in_production',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
  },
  MAIL: {
    HOST: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    PORT: Number(process.env.MAIL_PORT) || 2525,
    USER: process.env.MAIL_USER || '',
    PASSWORD: process.env.MAIL_PASSWORD || '',
    FROM: process.env.MAIL_FROM || 'noreply@washy.com',
  },
  PAYSTACK: {
    SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
    PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
    BASE_URL: 'https://api.paystack.co',
    WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  },
  SMS: {
    TERMII_API_KEY: process.env.TERMII_API_KEY || '',
    TERMII_BASE_URL: 'https://api.ng.termii.com/api',
    SENDER_ID: process.env.SMS_SENDER_ID || 'Washy',
  },
  WHATSAPP: {
    API_KEY: process.env.WHATSAPP_API_KEY || '',
    PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  },
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: Number(process.env.REDIS_PORT) || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || '',
    URL: process.env.REDIS_URL || '',
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

// Export alias for backward compatibility
export const { CONFIGS: configs } = { CONFIGS };
