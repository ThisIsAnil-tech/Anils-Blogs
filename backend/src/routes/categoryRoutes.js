const express = require('express');
const router = express.Router();

// Import controllers
const categoryController = require('../controllers/categoryController');

// Destructure with fallbacks
const {
  getCategories = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getCategoryBySlug = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  createCategory = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateCategory = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  deleteCategory = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getCategoryBlogs = (req, res) => res.status(501).json({ message: 'Not implemented' })
} = categoryController;

const {
  categoryValidation,
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

// Get all categories
router.get('/', getCategories);

// Get category by slug
router.get('/:slug', slugValidation, getCategoryBySlug);

// Get blogs in category
router.get('/:slug/blogs', slugValidation, paginationValidation, getCategoryBlogs);

// ============================================
// Admin Routes
// ============================================
router.post('/', protect, isAdmin, categoryValidation, createCategory);
router.put('/:id', protect, isAdmin, idValidation, categoryValidation, updateCategory);
router.delete('/:id', protect, isAdmin, idValidation, deleteCategory);

module.exports = router;