const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Custom key generator function
 * @param {Function} shouldCache - Function to determine if response should be cached
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null, shouldCache = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not enabled
    if (!cache.isEnabled()) {
      logger.debug('Cache skipped - Redis not enabled');
      return next();
    }

    // Skip caching for admin routes if not specified
    if (req.path.includes('/admin') && !req.query._cache) {
      return next();
    }

    // Check custom shouldCache function
    if (shouldCache && !shouldCache(req)) {
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

    // Add user role to key for role-based caching
    if (req.user && req.user.role) {
      key = `${key}:role_${req.user.role}`;
    }

    try {
      // Check cache
      const cachedData = await cache.get(key);
      if (cachedData) {
        logger.debug(`✅ Cache hit: ${key}`);
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttl);
        return res.json(cachedData);
      }

      logger.debug(`❌ Cache miss: ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Store original send function
      const originalSend = res.json;
      const originalStatus = res.status;
      
      // Override status to capture status code
      let statusCode = 200;
      res.status = function(code) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Override send function to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (statusCode === 200 || statusCode === 201) {
          cache.set(key, data, ttl).catch(err => {
            logger.error(`❌ Cache set error: ${err.message}`);
          });
          logger.debug(`📝 Cache set: ${key} (TTL: ${ttl}s)`);
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`❌ Cache middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * @param {string|Array} patterns - Cache key patterns to invalidate
 * @param {boolean} waitForCompletion - Wait for invalidation to complete
 */
const invalidateCache = (patterns, waitForCompletion = false) => {
  return async (req, res, next) => {
    if (!cache.isEnabled()) {
      return next();
    }

    try {
      const patternArray = Array.isArray(patterns) ? patterns : [patterns];
      
      if (waitForCompletion) {
        // Wait for all invalidations to complete
        for (const pattern of patternArray) {
          await cache.delPattern(pattern);
          logger.debug(`🗑️ Cache invalidated: ${pattern}`);
        }
      } else {
        // Fire and forget
        Promise.all(patternArray.map(pattern => cache.delPattern(pattern)))
          .then(() => {
            logger.debug(`🗑️ Cache invalidated: ${patternArray.join(', ')}`);
          })
          .catch(err => {
            logger.error(`❌ Cache invalidation error: ${err.message}`);
          });
      }
    } catch (error) {
      logger.error(`❌ Cache invalidation error: ${error.message}`);
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

/**
 * Skip cache for certain paths
 */
const skipCacheForPaths = (paths) => {
  return (req) => {
    return paths.some(path => req.path.includes(path));
  };
};

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const baseKey = `${req.method}:${req.path}`;
  const queryString = Object.keys(req.query)
    .sort()
    .filter(key => key !== '_cache')
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return queryString ? `${baseKey}?${queryString}` : baseKey;
};

/**
 * Cache control headers middleware
 */
const cacheControl = (maxAge = 3600, isPrivate = false) => {
  return (req, res, next) => {
    const cacheControl = isPrivate ? 'private' : 'public';
    res.setHeader('Cache-Control', `${cacheControl}, max-age=${maxAge}`);
    next();
  };
};

/**
 * Conditional cache middleware (ETag-based)
 */
const conditionalCache = (generateEtag) => {
  return async (req, res, next) => {
    if (!cache.isEnabled()) {
      return next();
    }

    try {
      const etag = generateEtag(req);
      const ifNoneMatch = req.headers['if-none-match'];

      if (ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('ETag', etag);
      next();
    } catch (error) {
      logger.error(`❌ Conditional cache error: ${error.message}`);
      next();
    }
  };
};

/**
 * Clear all cache
 */
const clearAllCache = async () => {
  if (!cache.isEnabled()) {
    return false;
  }

  try {
    await cache.flushAll();
    logger.info('🗑️ All cache cleared');
    return true;
  } catch (error) {
    logger.error(`❌ Clear all cache error: ${error.message}`);
    return false;
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  if (!cache.isEnabled()) {
    return { enabled: false };
  }

  try {
    const stats = await cache.getStats();
    return {
      enabled: true,
      connected: true,
      ...stats
    };
  } catch (error) {
    return {
      enabled: true,
      connected: false,
      error: error.message
    };
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  skipCacheIfAuthenticated,
  skipCacheForPaths,
  generateCacheKey,
  cacheControl,
  conditionalCache,
  clearAllCache,
  getCacheStats
};