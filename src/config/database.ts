/**
 * Database Configuration
 * MongoDB connection with Mongoose
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { CONFIGS } from '@/constants/configs.constant';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = CONFIGS.MONGODB.URL;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URL is not defined in environment variables');
    }
    
    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
    throw error;
  }
};

export default { connectDB, disconnectDB };
