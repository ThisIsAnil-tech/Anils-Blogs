const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBlogs
} = require('../controllers/categoryController');
const {
  categoryValidation,
  idValidation,
  slugValidation,
  paginationValidation
} = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.use(generalLimiter);

// Get all categories
router.get('/', getCategories);

// Get category by slug
router.get('/:slug', slugValidation, getCategoryBySlug);

// Get blogs in category
router.get('/:slug/blogs', slugValidation, paginationValidation, getCategoryBlogs);

// Admin routes
router.use(protect);
router.use(isAdmin);

// Create category
router.post('/', categoryValidation, createCategory);

// Update category
router.put('/:id', idValidation, categoryValidation, updateCategory);

// Delete category
router.delete('/:id', idValidation, deleteCategory);

module.exports = router;