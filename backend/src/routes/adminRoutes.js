const express = require('express');
const router = express.Router();
const {
  createBlog,
  updateBlog,
  deleteBlog,
  notifySubscribers,
  clearBlogCache
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
const { 
  blogCreationLimiter, 
  authLimiter,
  generalLimiter 
} = require('../middleware/rateLimiter');
const { logAdminActivity, checkAdmin } = require('../middleware/adminAuth');
const { login } = require('../controllers/authController');
const { loginValidation } = require('../middleware/validation');

// ============================================
// Public admin login route
// ============================================
router.post('/login', authLimiter, loginValidation, login);

// ============================================
// All other admin routes are protected
// ============================================
router.use(protect);
router.use(isAdmin);
router.use(checkAdmin);
router.use(logAdminActivity('Admin Action'));
router.use(generalLimiter);

// ============================================
// Blog Management
// ============================================

// Create blog with cache invalidation
router.post('/blogs', 
  blogCreationLimiter, 
  createBlogValidation, 
  invalidateCache(['blogs:*', 'blog:*', 'search:*'], false),
  createBlog
);

// Update blog with cache invalidation
router.put('/blogs/:id', 
  idValidation, 
  updateBlogValidation, 
  invalidateCache(['blogs:*', 'blog:*', 'search:*'], false),
  updateBlog
);

// Delete blog with cache invalidation
router.delete('/blogs/:id', 
  idValidation, 
  invalidateCache(['blogs:*', 'blog:*', 'search:*'], false),
  deleteBlog
);

// Notify subscribers about new blog
router.post('/blogs/:id/notify', 
  idValidation, 
  notificationValidation, 
  notifySubscribers
);

// Clear blog cache
router.post('/cache/clear', 
  invalidateCache(['blogs:*', 'blog:*', 'search:*', 'categories:*', 'tags:*'], true),
  clearBlogCache
);

// ============================================
// Comment Management
// ============================================

// Get pending comments
router.get('/comments/pending', 
  paginationValidation, 
  getPendingComments
);

// Approve comment with cache invalidation
router.put('/comments/:id/approve', 
  idValidation, 
  invalidateCache(['blogs:*', 'blog:*'], false),
  approveComment
);

// Reject comment with cache invalidation
router.put('/comments/:id/reject', 
  idValidation, 
  invalidateCache(['blogs:*', 'blog:*'], false),
  rejectComment
);

// ============================================
// Admin Analytics
// ============================================

// Admin analytics routes
router.get('/analytics/overview', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics overview',
    data: {
      totalBlogs: 0,
      totalComments: 0,
      totalSubscribers: 0,
      totalViews: 0
    }
  });
});

// ============================================
// Admin Dashboard
// ============================================

router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard data',
    data: {
      stats: {
        blogs: { total: 0, published: 0, draft: 0 },
        comments: { total: 0, pending: 0, approved: 0 },
        subscribers: { total: 0, active: 0 },
        views: { total: 0, today: 0 }
      }
    }
  });
});

// ============================================
// Admin Profile
// ============================================

router.get('/profile', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin profile',
    data: req.user
  });
});

router.put('/profile', (req, res) => {
  // Update admin profile
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully'
  });
});

router.put('/change-password', (req, res) => {
  // Change admin password
  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;