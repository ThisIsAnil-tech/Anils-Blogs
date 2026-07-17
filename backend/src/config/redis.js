const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

const connectRedis = async () => {
  try {
    // Check if Redis is enabled
    if (process.env.REDIS_ENABLED !== 'true') {
      logger.info('ℹ️  Redis is disabled in environment variables');
      return null;
    }

    // Check if already connected
    if (isRedisConnected && redisClient) {
      logger.debug('Redis already connected');
      return redisClient;
    }

    // Check if we've exceeded max retries
    if (connectionAttempts >= MAX_RETRIES) {
      logger.warn(`Redis connection failed after ${MAX_RETRIES} attempts. Disabling Redis.`);
      process.env.REDIS_ENABLED = 'false';
      return null;
    }

    connectionAttempts++;

    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    const redisDB = parseInt(process.env.REDIS_DB) || 0;

    logger.info(`📡 Connecting to Redis at ${redisUrl.replace(/:[^@]*@/, ':***@')} (attempt ${connectionAttempts})`);

    redisClient = createClient({
      url: redisUrl,
      password: redisPassword,
      database: redisDB,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          // Exponential backoff
          const delay = Math.min(Math.pow(2, retries) * 100, 3000);
          logger.debug(`Redis reconnect attempt ${retries + 1} in ${delay}ms`);
          return delay;
        },
        connectTimeout: 5000,
        keepAlive: 10000,
        noDelay: true
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      isRedisConnected = true;
      connectionAttempts = 0;
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready');
      isRedisConnected = true;
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection closed');
      isRedisConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection error: ${error.message}`);
    isRedisConnected = false;
    
    if (connectionAttempts < MAX_RETRIES) {
      logger.info(`Retrying Redis connection in 5 seconds... (${connectionAttempts}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectRedis();
    }
    
    process.env.REDIS_ENABLED = 'false';
    logger.warn('Redis disabled due to connection failures');
    return null;
  }
};

// Cache helper functions
const cache = {
  // Get cached data
  get: async (key) => {
    if (!isRedisConnected || !redisClient) {
      logger.debug(`Cache miss (Redis not connected): ${key}`);
      return null;
    }
    try {
      const data = await redisClient.get(key);
      if (data) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(data);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  },

  // Set cache with TTL
  set: async (key, value, ttl = 3600) => {
    if (!isRedisConnected || !redisClient) {
      logger.debug(`Cache set skipped (Redis not connected): ${key}`);
      return false;
    }
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
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
      logger.debug(`Cache deleted: ${key}`);
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
        logger.debug(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
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
  getClient: () => redisClient,

  // Get cache stats
  getStats: async () => {
    if (!isRedisConnected || !redisClient) {
      return { connected: false };
    }
    try {
      const info = await redisClient.info();
      const lines = info.split('\n');
      const stats = { connected: true };
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key.trim()] = value.trim();
        }
      });
      return stats;
    } catch (error) {
      logger.error(`Redis stats error: ${error.message}`);
      return { connected: true, error: error.message };
    }
  },

  // Flush all cache
  flushAll: async () => {
    if (!isRedisConnected || !redisClient) return false;
    try {
      await redisClient.flushAll();
      logger.info('Redis cache flushed');
      return true;
    } catch (error) {
      logger.error(`Redis flush error: ${error.message}`);
      return false;
    }
  }
};

// Disconnect Redis gracefully
const disconnectRedis = async () => {
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected gracefully');
      isRedisConnected = false;
    } catch (error) {
      logger.error(`Redis disconnect error: ${error.message}`);
    }
  }
};

module.exports = { 
  connectRedis, 
  disconnectRedis,
  cache, 
  redisClient,
  isRedisConnected: () => isRedisConnected
};