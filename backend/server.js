/**
 * Server Entry Point
 * This file starts the Express server and handles all initialization
 */

require('dotenv').config();

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
  logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  process.exit(1);
});

// ============================================
// Handle Unhandled Promise Rejections
// ============================================
process.on('unhandledRejection', (err) => {
  consoleLog(`UNHANDLED REJECTION: ${err.message}`, 'error');
  logger.error('💥 UNHANDLED REJECTION! Shutting down...');
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  process.exit(1);
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  consoleLog(`Received ${signal}. Shutting down gracefully...`);
  logger.info(`⚠️ Received ${signal}. Closing server gracefully...`);
  
  try {
    // Close MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      consoleLog('MongoDB connection closed', 'success');
      logger.info('✅ MongoDB connection closed');
    }
    
    // Close Redis connection (if available)
    try {
      const { redisClient } = require('./src/config/redis');
      if (redisClient && redisClient.quit) {
        await redisClient.quit();
        consoleLog('Redis connection closed', 'success');
        logger.info('✅ Redis connection closed');
      }
    } catch (redisErr) {
      // Redis not initialized, ignore
    }
    
    consoleLog('All connections closed. Process terminating...', 'success');
    logger.info('✅ All connections closed. Process terminating...');
    process.exit(0);
  } catch (error) {
    consoleLog(`Error during shutdown: ${error.message}`, 'error');
    logger.error(`❌ Error during shutdown: ${error.message}`);
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
    logger.info('🚀 Starting server initialization...');

    // 1. Connect to MongoDB
    consoleLog('Connecting to MongoDB...');
    logger.info('📡 Connecting to MongoDB...');
    await connectDB();
    consoleLog('MongoDB connected successfully', 'success');
    logger.info('✅ MongoDB connected successfully');

    // 2. Connect to Redis (optional)
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        consoleLog('Connecting to Redis...');
        logger.info('📡 Connecting to Redis...');
        const { connectRedis } = require('./src/config/redis');
        await connectRedis();
        consoleLog('Redis connected successfully', 'success');
        logger.info('✅ Redis connected successfully');
      } catch (redisError) {
        consoleLog(`Redis connection failed: ${redisError.message}`, 'error');
        logger.warn(`Redis connection failed: ${redisError.message}`);
        // Continue without Redis
      }
    } else {
      consoleLog('Redis is disabled. Skipping...');
      logger.info('ℹ️ Redis is disabled. Skipping Redis connection...');
    }

    // 3. Initialize MEGA.nz
    try {
      consoleLog('Connecting to MEGA.nz...');
      logger.info('📡 Connecting to MEGA.nz...');
      const { initializeMega } = require('./src/config/mega');
      await initializeMega();
      consoleLog('MEGA.nz connected successfully', 'success');
      logger.info('✅ MEGA.nz connected successfully');
    } catch (megaError) {
      consoleLog(`MEGA.nz connection failed: ${megaError.message}`, 'error');
      logger.warn(`MEGA.nz connection failed: ${megaError.message}`);
      // Continue without MEGA (will affect blog content storage)
    }

    // 4. Get port from environment
    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    consoleLog(`Starting server on port ${PORT}...`);
    logger.info(`📡 Starting server on port ${PORT}...`);

    // 5. Start the server
    server = app.listen(PORT, () => {
      consoleLog('========================================', 'success');
      consoleLog(`✅ Server is running on port ${PORT}`);
      consoleLog(`🌍 Environment: ${NODE_ENV}`);
      consoleLog(`🔗 URL: http://localhost:${PORT}`);
      consoleLog(`💚 Health Check: http://localhost:${PORT}/health`);
      consoleLog('========================================', 'success');
      
      logger.info('========================================');
      logger.info(`✅ Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
      logger.info('========================================');
      
      // Log all registered routes in development
      if (NODE_ENV === 'development') {
        try {
          logger.info('📋 Registered Routes:');
          const routes = [];
          
          const extractRoutes = (stack, basePath = '') => {
            stack.forEach((layer) => {
              if (layer.route) {
                // Route handler
                const methods = Object.keys(layer.route.methods);
                methods.forEach(method => {
                  routes.push({
                    method: method.toUpperCase(),
                    path: basePath + layer.route.path
                  });
                });
              } else if (layer.name === 'router' && layer.handle.stack) {
                // Router middleware
                const routerPath = layer.regexp.source
                  .replace('\\/?(?=\\/|$)', '')
                  .replace(/\\\//g, '/')
                  .replace(/\^/g, '')
                  .replace(/\?/g, '')
                  .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
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
          logger.warn('Could not extract routes for logging');
        }
      }
    });

    // ============================================
    // Server Event Listeners
    // ============================================

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        consoleLog(`Port ${PORT} is already in use!`, 'error');
        logger.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        consoleLog(`Server error: ${error.message}`, 'error');
        logger.error(`❌ Server error: ${error.message}`);
        process.exit(1);
      }
    });

    server.on('listening', () => {
      logger.info(`✅ Server listening on port ${PORT}`);
    });

    server.on('close', () => {
      logger.info('🔄 Server closed');
    });

    // ============================================
    // Signal Handlers for Graceful Shutdown
    // ============================================

    // Handle SIGTERM (e.g., from PM2, Kubernetes)
    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM');
    });

    // Handle SIGINT (e.g., Ctrl+C)
    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT');
    });

    // ============================================
    // Return server instance
    // ============================================
    return server;

  } catch (error) {
    consoleLog(`Server initialization failed: ${error.message}`, 'error');
    consoleLog(`Stack: ${error.stack}`, 'error');
    logger.error('❌ Server initialization failed!');
    logger.error(`Error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    
    // Close server if it was started
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