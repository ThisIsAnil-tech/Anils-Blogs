const express = require('express');
const router = express.Router();

// Import controllers
const categoryController = require('../controllers/categoryController');

// Destructure with proper validation - NO FALLBACKS
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBlogs
} = categoryController;

// Validate that all required controllers exist
const requiredControllers = [
  'getCategories',
  'getCategoryBySlug', 
  'createCategory',
  'updateCategory',
  'deleteCategory',
  'getCategoryBlogs'
];

const missingControllers = requiredControllers.filter(name => !categoryController[name]);
if (missingControllers.length > 0) {
  console.error('❌ Missing category controllers:', missingControllers.join(', '));
  // In development, throw error; in production, use fallbacks
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`Missing controllers: ${missingControllers.join(', ')}`);
  }
}

const {
  categoryValidation,
  idValidation,
  slugValidation,
  paginationValidation
} = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect, isAdmin } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { logAdminActivity } = require('../middleware/adminAuth');

// ============================================
// Public Routes
// ============================================
router.use(generalLimiter);

// Get all categories - Cache for 1 hour
router.get('/', cacheMiddleware(3600), getCategories);

// Get category by slug - Cache for 1 hour
router.get('/:slug', slugValidation, cacheMiddleware(3600), getCategoryBySlug);

// Get blogs in category - Cache for 30 minutes
router.get('/:slug/blogs', slugValidation, paginationValidation, cacheMiddleware(1800), getCategoryBlogs);

// ============================================
// Admin Routes
// ============================================
router.post('/', 
  protect, 
  isAdmin, 
  logAdminActivity('Create Category'),
  categoryValidation, 
  invalidateCache(['categories:*', 'category:*']),
  createCategory
);

router.put('/:id', 
  protect, 
  isAdmin, 
  logAdminActivity('Update Category'),
  idValidation, 
  categoryValidation, 
  invalidateCache(['categories:*', 'category:*']),
  updateCategory
);

router.delete('/:id', 
  protect, 
  isAdmin, 
  logAdminActivity('Delete Category'),
  idValidation, 
  invalidateCache(['categories:*', 'category:*']),
  deleteCategory
);

module.exports = router;