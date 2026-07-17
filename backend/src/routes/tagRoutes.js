const express = require('express');
const router = express.Router();

// Import controllers
const tagController = require('../controllers/tagController');

// Destructure with proper validation - NO FALLBACKS
const {
  getTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getTagBlogs,
  getPopularTags
} = tagController;

// Validate that all required controllers exist
const requiredControllers = [
  'getTags',
  'getTagBySlug',
  'createTag', 
  'updateTag',
  'deleteTag',
  'getTagBlogs',
  'getPopularTags'
];

const missingControllers = requiredControllers.filter(name => !tagController[name]);
if (missingControllers.length > 0) {
  console.error('❌ Missing tag controllers:', missingControllers.join(', '));
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`Missing controllers: ${missingControllers.join(', ')}`);
  }
}

const {
  tagValidation,
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

// Get all tags - Cache for 1 hour
router.get('/', cacheMiddleware(3600), getTags);

// Get popular tags - Cache for 2 hours
router.get('/popular', cacheMiddleware(7200), getPopularTags);

// Get tag by slug - Cache for 1 hour
router.get('/:slug', slugValidation, cacheMiddleware(3600), getTagBySlug);

// Get blogs with tag - Cache for 30 minutes
router.get('/:slug/blogs', slugValidation, paginationValidation, cacheMiddleware(1800), getTagBlogs);

// ============================================
// Admin Routes
// ============================================
router.post('/', 
  protect, 
  isAdmin, 
  logAdminActivity('Create Tag'),
  tagValidation, 
  invalidateCache(['tags:*', 'tag:*']),
  createTag
);

router.put('/:id', 
  protect, 
  isAdmin, 
  logAdminActivity('Update Tag'),
  idValidation, 
  tagValidation, 
  invalidateCache(['tags:*', 'tag:*']),
  updateTag
);

router.delete('/:id', 
  protect, 
  isAdmin, 
  logAdminActivity('Delete Tag'),
  idValidation, 
  invalidateCache(['tags:*', 'tag:*']),
  deleteTag
);

module.exports = router;