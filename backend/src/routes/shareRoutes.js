const express = require('express');
const router = express.Router();
const {
  shareBlog,
  getShareCount,
  getShareAnalytics
} = require('../controllers/shareController');
const { idValidation, analyticsValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { trackIP } = require('../middleware/ipTracker');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.use(generalLimiter);
router.use(trackIP);

// Share blog
router.post('/:blogId', idValidation, shareBlog);

// Get share count
router.get('/:blogId/count', idValidation, getShareCount);

// Admin routes for analytics
router.get('/admin/analytics', protect, isAdmin, analyticsValidation, getShareAnalytics);

module.exports = router;