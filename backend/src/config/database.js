const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD;

    // In production, require password to be set via env
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !password) {
      logger.warn('⚠️  ADMIN_PASSWORD not set in production. Skipping admin seeding.');
      logger.warn('   Please set ADMIN_PASSWORD environment variable.');
      return;
    }

    // Use default password only in development
    const adminPassword = password || (isProduction ? null : 'password123');
    
    if (!adminPassword) {
      logger.warn('⚠️  No admin password available. Skipping admin seeding.');
      return;
    }

    // Check if any admin or user with same username/email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (!existingUser) {
      logger.info('📡 Seeding default admin user...');
      
      const adminUser = await User.create({
        username,
        email,
        password: adminPassword,
        fullName: 'Admin User',
        role: 'admin',
        isActive: true
      });
      
      logger.info(`✅ Default admin user seeded successfully: ${username}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`   🔑 Password: ${adminPassword}`);
        logger.info('   ⚠️  Change this password immediately in production!');
      }
    } else {
      logger.info('ℹ️  Admin user already exists. Skipping seeding.');
    }
  } catch (error) {
    logger.error(`❌ Admin user seeding failed: ${error.message}`);
    // Don't exit - let the app continue even if seeding fails
  }
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    logger.info('📡 Connecting to MongoDB...');

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`   Database: ${conn.connection.name}`);
    logger.info(`   Connection Pool Size: ${conn.connection.options?.maxPoolSize || 'default'}`);

    // Run the admin seeding logic
    await seedAdmin();

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle connection errors after initial connection
    mongoose.connection.on('close', () => {
      logger.warn('MongoDB connection closed');
    });

    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Don't exit immediately - allow retry mechanism in server.js
    throw error;
  }
};

// Helper function to check connection status
const checkConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[state] || 'unknown';
};

// Helper function to close connection gracefully
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
module.exports.checkConnection = checkConnection;
module.exports.closeConnection = closeConnection;