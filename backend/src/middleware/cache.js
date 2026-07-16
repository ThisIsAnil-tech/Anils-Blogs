const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Custom key generator function
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not enabled
    if (!cache.isEnabled()) {
      return next();
    }

    // Generate cache key
    let key;
    if (keyGenerator) {
      key = keyGenerator(req);
    } else {
      // Default key: method:path:query
      const queryString = Object.keys(req.query).length > 0 
        ? `:${JSON.stringify(req.query)}` 
        : '';
      key = `${req.method}:${req.path}${queryString}`;
    }

    try {
      // Check cache
      const cachedData = await cache.get(key);
      if (cachedData) {
        logger.debug(`Cache hit: ${key}`);
        return res.json(cachedData);
      }

      // Store original send function
      const originalSend = res.json;
      
      // Override send function to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cache.set(key, data, ttl).catch(err => {
            logger.error(`Cache set error: ${err.message}`);
          });
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * @param {string|Array} patterns - Cache key patterns to invalidate
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    if (!cache.isEnabled()) {
      return next();
    }

    try {
      const patternArray = Array.isArray(patterns) ? patterns : [patterns];
      for (const pattern of patternArray) {
        await cache.delPattern(pattern);
        logger.debug(`Cache invalidated: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache invalidation error: ${error.message}`);
    }

    next();
  };
};

/**
 * Skip cache for authenticated requests
 */
const skipCacheIfAuthenticated = (req) => {
  return req.user && req.user.role === 'admin';
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  skipCacheIfAuthenticated
};