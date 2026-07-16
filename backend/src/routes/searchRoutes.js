const express = require('express');
const router = express.Router();

// Import controllers
const searchController = require('../controllers/searchController');

// Destructure with fallbacks
const {
  searchBlogs = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  searchSuggestions = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  advancedSearch = (req, res) => res.status(501).json({ message: 'Not implemented' })
} = searchController;

const { searchValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

// ============================================
// Public Routes
// ============================================
router.use(generalLimiter);

// Basic search
router.get('/', searchValidation, searchBlogs);

// Search suggestions (autocomplete)
router.get('/suggestions', searchSuggestions);

// Advanced search
router.post('/advanced', advancedSearch);

module.exports = router;