/**
 * Configuration file for the application
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { CONFIGS } from "@/constants/configs.constant";

/**
 * Configuration constants for the application
 */
const config = {
  env: CONFIGS.APP.ENV,
  port: CONFIGS.APP.PORT,
  api: {
    prefix: '/api/v1',
  },
  database: {
    uri: CONFIGS.MONGODB.URL,
  },
  jwt: {
    secret: CONFIGS.JWT.SECRET,
    expiresIn: CONFIGS.JWT.EXPIRES_IN,
  },
  cors: {
    origin: CONFIGS.CORS,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
