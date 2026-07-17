const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'password123';

    // Check if any admin or user with same username/email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (!existingUser) {
      logger.info('📡 Seeding default admin user...');
      await User.create({
        username,
        email,
        password,
        fullName: 'Admin User',
        role: 'admin',
        isActive: true
      });
      logger.info('✅ Default admin user seeded successfully');
    } else {
      logger.info('ℹ️ Admin user already exists. Skipping seeding.');
    }
  } catch (error) {
    logger.error(`❌ Admin user seeding failed: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Run the admin seeding logic
    await seedAdmin();

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;