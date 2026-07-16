const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  try {
    if (process.env.REDIS_ENABLED !== 'true') {
      logger.info('Redis is disabled in environment variables');
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      isRedisConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready');
      isRedisConnected = true;
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection closed');
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection error: ${error.message}`);
    isRedisConnected = false;
    return null;
  }
};

// Cache helper functions
const cache = {
  // Get cached data
  get: async (key) => {
    if (!isRedisConnected || !redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  },

  // Set cache with TTL
  set: async (key, value, ttl = 3600) => {
    if (!isRedisConnected || !redisClient) return false;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis set error: ${error.message}`);
      return false;
    }
  },

  // Delete cache
  del: async (key) => {
    if (!isRedisConnected || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis delete error: ${error.message}`);
      return false;
    }
  },

  // Delete by pattern
  delPattern: async (pattern) => {
    if (!isRedisConnected || !redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis delete pattern error: ${error.message}`);
      return false;
    }
  },

  // Check if cache is enabled
  isEnabled: () => isRedisConnected && redisClient !== null,

  // Get client instance
  getClient: () => redisClient
};

module.exports = { connectRedis, cache, redisClient };