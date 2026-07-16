const express = require('express');
const router = express.Router();
const {
  getTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getTagBlogs,
  getPopularTags
} = require('../controllers/tagController');
const {
  tagValidation,
  idValidation,
  slugValidation,
  paginationValidation
} = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.use(generalLimiter);

// Get all tags
router.get('/', getTags);

// Get popular tags
router.get('/popular', getPopularTags);

// Get tag by slug
router.get('/:slug', slugValidation, getTagBySlug);

// Get blogs with tag
router.get('/:slug/blogs', slugValidation, paginationValidation, getTagBlogs);

// Admin routes
router.use(protect);
router.use(isAdmin);

// Create tag
router.post('/', tagValidation, createTag);

// Update tag
router.put('/:id', idValidation, tagValidation, updateTag);

// Delete tag
router.delete('/:id', idValidation, deleteTag);

module.exports = router;