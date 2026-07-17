const express = require('express');
const router = express.Router();
const {
  toggleLike,
  checkLikeStatus,
  getLikeCount
} = require('../controllers/likeController');
const { blogIdValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { trackIP } = require('../middleware/ipTracker');

// All like routes are public
router.use(generalLimiter);
router.use(trackIP);

// Toggle like
router.post('/:blogId', blogIdValidation, toggleLike);

// Check if user liked
router.get('/:blogId/check', blogIdValidation, checkLikeStatus);

// Get like count
router.get('/:blogId/count', blogIdValidation, getLikeCount);

module.exports = router;