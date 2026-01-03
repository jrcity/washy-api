/**
 * Server Entry Point
 * Washy API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import app from './app';
import { connectDB } from '@/config/database';
import { CONFIGS } from '@/constants/configs.constant';

const PORT = CONFIGS.APP.PORT || 3000;

// Connect to database then start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🧺 Washy API v1.0.0                            ║
║   Multi-branch Laundry Management System              ║
║                                                       ║
║   Environment: ${CONFIGS.APP.ENV.padEnd(40)}║
║   Server running on: http://localhost:${String(PORT).padEnd(17)}║
║   API Base: /api/v1                                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
