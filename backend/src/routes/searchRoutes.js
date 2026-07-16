const express = require('express');
const router = express.Router();
const {
  searchBlogs,
  searchSuggestions,
  advancedSearch
} = require('../controllers/searchController');
const { searchValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

// Public routes
router.use(generalLimiter);

// Basic search
router.get('/', searchValidation, searchBlogs);

// Search suggestions (autocomplete)
router.get('/suggestions', searchSuggestions);

// Advanced search
router.post('/advanced', advancedSearch);

module.exports = router;