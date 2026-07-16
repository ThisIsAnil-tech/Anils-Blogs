const express = require('express');
const router = express.Router();

// Import controllers - make sure each one exists
const tagController = require('../controllers/tagController');

// Destructure with fallbacks to prevent undefined errors
const {
  getTags = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getTagBySlug = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  createTag = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateTag = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  deleteTag = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getTagBlogs = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getPopularTags = (req, res) => res.status(501).json({ message: 'Not implemented' })
} = tagController;

const {
  tagValidation,
  idValidation,
  slugValidation,
  paginationValidation
} = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect, isAdmin } = require('../middleware/auth');

// ============================================
// Public Routes
// ============================================
router.use(generalLimiter);

// Get all tags
router.get('/', getTags);

// Get popular tags
router.get('/popular', getPopularTags);

// Get tag by slug
router.get('/:slug', slugValidation, getTagBySlug);

// Get blogs with tag
router.get('/:slug/blogs', slugValidation, paginationValidation, getTagBlogs);

// ============================================
// Admin Routes
// ============================================
router.post('/', protect, isAdmin, tagValidation, createTag);
router.put('/:id', protect, isAdmin, idValidation, tagValidation, updateTag);
router.delete('/:id', protect, isAdmin, idValidation, deleteTag);

module.exports = router;