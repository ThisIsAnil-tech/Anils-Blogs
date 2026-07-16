const express = require('express');
const router = express.Router();
const {
  getComments,
  addComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const {
  commentValidation,
  idValidation,
  paginationValidation
} = require('../middleware/validation');
const { commentLimiter } = require('../middleware/rateLimiter');
const { trackIP } = require('../middleware/ipTracker');
const { detectDevice } = require('../middleware/deviceInfo');
const { optionalAuth } = require('../middleware/auth');

// Public routes
router.use(trackIP);
router.use(detectDevice);

// Get comments for a blog
router.get('/:blogId', paginationValidation, getComments);

// Add comment to blog
router.post('/:blogId', commentLimiter, commentValidation, addComment);

// Update comment (by IP)
router.put('/:id', idValidation, updateComment);

// Delete comment (by IP or admin)
router.delete('/:id', optionalAuth, idValidation, deleteComment);

module.exports = router;