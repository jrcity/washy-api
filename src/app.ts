/**
 * Express Application Configuration
 * Washy API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { CONFIGS } from '@/constants/configs.constant';
import { swaggerSpec } from '@/config/swagger';
import {
  globalRateLimit,
  deepSanitize,
  securityHeaders
} from '@/middlewares/security.middleware';

const app: Application = express();

// Security headers
app.use(securityHeaders);

// Helmet security
app.use(helmet());

// CORS
app.use(cors({
  origin: [...CONFIGS.CORS],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL injection prevention
app.use(deepSanitize);

// Compression
app.use(compression());

// Global rate limiting
app.use(globalRateLimit);

// Logging
if (CONFIGS.APP.ENV !== 'test') {
  app.use(morgan('dev'));
}

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Swagger Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; }
  `,
  customSiteTitle: 'Washy API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true
  }
}));

// Swagger JSON endpoint
app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Washy API',
    version: '1.0.0',
    description: 'Multi-branch laundry management system',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;


