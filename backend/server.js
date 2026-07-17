/**
 * Server Entry Point
 * This file starts the Express server and handles all initialization
 */

require('dotenv').config();

// ============================================
// Environment Variable Validation
// ============================================
const validateEnvironment = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM'
  ];

  const optionalVars = [
    'REDIS_ENABLED',
    'REDIS_URL',
    'MEGA_EMAIL',
    'MEGA_PASSWORD',
    'ADMIN_USERNAME',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n⚠️  Server cannot start without these variables.');
    process.exit(1);
  }

  // Check for critical optional vars
  if (process.env.REDIS_ENABLED === 'true' && !process.env.REDIS_URL) {
    console.warn('⚠️  Redis is enabled but REDIS_URL is not set. Redis will be disabled.');
    process.env.REDIS_ENABLED = 'false';
  }

  if (process.env.NODE_ENV === 'production') {
    const adminVars = ['ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
    const missingAdmin = adminVars.filter(v => !process.env[v]);
    if (missingAdmin.length > 0) {
      console.warn('⚠️  In production, these admin variables should be set:');
      missingAdmin.forEach(v => console.warn(`   - ${v}`));
    }
  }

  console.log('✅ Environment variables validated successfully');
};

// Run validation
validateEnvironment();

// ============================================
// Immediate Console Logger (before winston loads)
// ============================================
const consoleLog = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📡';
  console.log(`${prefix} ${message}`);
};

consoleLog('Starting server initialization...');

// ============================================
// Import Dependencies
// ============================================
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

// ============================================
// Handle Uncaught Exceptions
// ============================================
process.on('uncaughtException', (err) => {
  consoleLog(`UNCAUGHT EXCEPTION: ${err.message}`, 'error');
  if (logger && logger.error) {
    logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(`Error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);
  }
  process.exit(1);
});

// ============================================
// Handle Unhandled Promise Rejections
// ============================================
process.on('unhandledRejection', (err) => {
  consoleLog(`UNHANDLED REJECTION: ${err.message}`, 'error');
  if (logger && logger.error) {
    logger.error('💥 UNHANDLED REJECTION! Shutting down...');
    logger.error(`Error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);
  }
  process.exit(1);
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  consoleLog(`Received ${signal}. Shutting down gracefully...`);
  if (logger && logger.info) {
    logger.info(`⚠️ Received ${signal}. Closing server gracefully...`);
  }
  
  try {
    // Close MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      consoleLog('MongoDB connection closed', 'success');
      if (logger && logger.info) logger.info('✅ MongoDB connection closed');
    }
    
    // Close Redis connection (if available)
    try {
      const { redisClient } = require('./src/config/redis');
      if (redisClient && redisClient.quit) {
        await redisClient.quit();
        consoleLog('Redis connection closed', 'success');
        if (logger && logger.info) logger.info('✅ Redis connection closed');
      }
    } catch (redisErr) {
      // Redis not initialized, ignore
    }
    
    consoleLog('All connections closed. Process terminating...', 'success');
    if (logger && logger.info) logger.info('✅ All connections closed. Process terminating...');
    process.exit(0);
  } catch (error) {
    consoleLog(`Error during shutdown: ${error.message}`, 'error');
    if (logger && logger.error) logger.error(`❌ Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

// ============================================
// Initialize and Start Server
// ============================================
const startServer = async () => {
  let server = null;
  
  try {
    consoleLog('Starting server initialization...');
    if (logger && logger.info) logger.info('🚀 Starting server initialization...');

    // 1. Connect to MongoDB with retry
    consoleLog('Connecting to MongoDB...');
    if (logger && logger.info) logger.info('📡 Connecting to MongoDB...');
    
    let retries = 3;
    let connected = false;
    while (retries > 0 && !connected) {
      try {
        await connectDB();
        connected = true;
        consoleLog('MongoDB connected successfully', 'success');
        if (logger && logger.info) logger.info('✅ MongoDB connected successfully');
      } catch (dbError) {
        retries--;
        consoleLog(`MongoDB connection failed. Retries left: ${retries}`, 'error');
        if (retries === 0) throw dbError;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 2. Connect to Redis (optional)
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        consoleLog('Connecting to Redis...');
        if (logger && logger.info) logger.info('📡 Connecting to Redis...');
        const { connectRedis } = require('./src/config/redis');
        await connectRedis();
        consoleLog('Redis connected successfully', 'success');
        if (logger && logger.info) logger.info('✅ Redis connected successfully');
      } catch (redisError) {
        consoleLog(`Redis connection failed: ${redisError.message}`, 'error');
        if (logger && logger.warn) logger.warn(`Redis connection failed: ${redisError.message}`);
        // Continue without Redis
        process.env.REDIS_ENABLED = 'false';
      }
    } else {
      consoleLog('Redis is disabled. Skipping...');
      if (logger && logger.info) logger.info('ℹ️ Redis is disabled. Skipping Redis connection...');
    }

    // 3. Initialize MEGA.nz (optional)
    if (process.env.MEGA_EMAIL && process.env.MEGA_PASSWORD) {
      try {
        consoleLog('Connecting to MEGA.nz...');
        if (logger && logger.info) logger.info('📡 Connecting to MEGA.nz...');
        const { initializeMega } = require('./src/config/mega');
        await initializeMega();
        consoleLog('MEGA.nz connected successfully', 'success');
        if (logger && logger.info) logger.info('✅ MEGA.nz connected successfully');
      } catch (megaError) {
        consoleLog(`MEGA.nz connection failed: ${megaError.message}`, 'error');
        if (logger && logger.warn) logger.warn(`MEGA.nz connection failed: ${megaError.message}`);
        // Continue without MEGA (will affect blog content storage)
      }
    } else {
      consoleLog('MEGA.nz credentials not provided. Skipping...');
    }

    // 4. Get port from environment
    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    consoleLog(`Starting server on port ${PORT}...`);
    if (logger && logger.info) logger.info(`📡 Starting server on port ${PORT}...`);

    // 5. Start the server
    server = app.listen(PORT, () => {
      consoleLog('========================================', 'success');
      consoleLog(`✅ Server is running on port ${PORT}`);
      consoleLog(`🌍 Environment: ${NODE_ENV}`);
      consoleLog(`🔗 URL: http://localhost:${PORT}`);
      consoleLog(`💚 Health Check: http://localhost:${PORT}/health`);
      consoleLog('========================================', 'success');
      
      if (logger && logger.info) {
        logger.info('========================================');
        logger.info(`✅ Server is running on port ${PORT}`);
        logger.info(`🌍 Environment: ${NODE_ENV}`);
        logger.info(`🔗 URL: http://localhost:${PORT}`);
        logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
        logger.info('========================================');
      }
      
      // Log all registered routes in development
      if (NODE_ENV === 'development' && logger && logger.info) {
        try {
          logger.info('📋 Registered Routes:');
          const routes = [];
          
          const extractRoutes = (stack, basePath = '') => {
            if (!stack) return;
            stack.forEach((layer) => {
              if (layer.route) {
                const methods = Object.keys(layer.route.methods);
                methods.forEach(method => {
                  routes.push({
                    method: method.toUpperCase(),
                    path: basePath + layer.route.path
                  });
                });
              } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
                const routerPath = layer.regexp ? layer.regexp.source
                  .replace('\\/?(?=\\/|$)', '')
                  .replace(/\\\//g, '/')
                  .replace(/\^/g, '')
                  .replace(/\?/g, '')
                  .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param') : '';
                extractRoutes(layer.handle.stack, basePath + routerPath);
              }
            });
          };

          if (app._router && app._router.stack) {
            extractRoutes(app._router.stack);
          }

          routes.forEach(route => {
            logger.info(`  ${route.method}  ${route.path}`);
          });
        } catch (routeError) {
          if (logger && logger.warn) logger.warn('Could not extract routes for logging');
        }
      }
    });

    // ============================================
    // Server Event Listeners
    // ============================================

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        consoleLog(`Port ${PORT} is already in use!`, 'error');
        if (logger && logger.error) logger.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        consoleLog(`Server error: ${error.message}`, 'error');
        if (logger && logger.error) logger.error(`❌ Server error: ${error.message}`);
        process.exit(1);
      }
    });

    server.on('listening', () => {
      if (logger && logger.info) logger.info(`✅ Server listening on port ${PORT}`);
    });

    server.on('close', () => {
      if (logger && logger.info) logger.info('🔌 Server closed');
    });

    // ============================================
    // Signal Handlers for Graceful Shutdown
    // ============================================

    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT');
    });

    return server;

  } catch (error) {
    consoleLog(`Server initialization failed: ${error.message}`, 'error');
    consoleLog(`Stack: ${error.stack}`, 'error');
    if (logger && logger.error) {
      logger.error('❌ Server initialization failed!');
      logger.error(`Error: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
    }
    
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
};

// ============================================
// Start the server
// ============================================
startServer();

// ============================================
// Export for testing
// ============================================
module.exports = { startServer };