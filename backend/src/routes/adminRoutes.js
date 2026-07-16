const express = require('express');
const router = express.Router();
const {
  createBlog,
  updateBlog,
  deleteBlog,
  notifySubscribers
} = require('../controllers/blogController');
const {
  approveComment,
  rejectComment,
  getPendingComments
} = require('../controllers/commentController');
const { protect, isAdmin } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');
const {
  createBlogValidation,
  updateBlogValidation,
  idValidation,
  notificationValidation,
  paginationValidation
} = require('../middleware/validation');
const { blogCreationLimiter } = require('../middleware/rateLimiter');
const { logAdminActivity } = require('../middleware/adminAuth');

// All admin routes are protected
router.use(protect);
router.use(isAdmin);
router.use(logAdminActivity('Admin Action'));

// Blog management with cache invalidation
router.post('/blogs', 
  blogCreationLimiter, 
  createBlogValidation, 
  invalidateCache(['blogs:*', 'blog:*']),
  createBlog
);

router.put('/blogs/:id', 
  idValidation, 
  updateBlogValidation, 
  invalidateCache(['blogs:*', 'blog:*']),
  updateBlog
);

router.delete('/blogs/:id', 
  idValidation, 
  invalidateCache(['blogs:*', 'blog:*']),
  deleteBlog
);

router.post('/blogs/:id/notify', 
  idValidation, 
  notificationValidation, 
  notifySubscribers
);

// Comment management
router.get('/comments/pending', paginationValidation, getPendingComments);
router.put('/comments/:id/approve', idValidation, approveComment);
router.put('/comments/:id/reject', idValidation, rejectComment);

module.exports = router;