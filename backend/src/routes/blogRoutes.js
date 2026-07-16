const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  getPopularBlogs,
  getRecentBlogs
} = require('../controllers/blogController');
const { cacheMiddleware } = require('../middleware/cache');
const { slugValidation, paginationValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { detectDevice } = require('../middleware/deviceInfo');
const { trackIP } = require('../middleware/ipTracker');

// All blog routes are public
router.use(generalLimiter);
router.use(trackIP);
router.use(detectDevice);

// Get blogs with pagination - Cache for 5 minutes
router.get('/', paginationValidation, cacheMiddleware(300), getBlogs);

// Get popular blogs - Cache for 30 minutes
router.get('/popular', cacheMiddleware(1800), getPopularBlogs);

// Get recent blogs - Cache for 30 minutes
router.get('/recent', cacheMiddleware(1800), getRecentBlogs);

// Get single blog by slug - Cache for 1 hour
router.get('/:slug', slugValidation, cacheMiddleware(3600), getBlogBySlug);

module.exports = router;