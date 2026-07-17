const express = require('express');
const router = express.Router();

// Import controllers
const searchController = require('../controllers/searchController');

// Destructure with proper validation - NO FALLBACKS
const {
  searchBlogs,
  searchSuggestions,
  advancedSearch
} = searchController;

// Validate that all required controllers exist
const requiredControllers = [
  'searchBlogs',
  'searchSuggestions',
  'advancedSearch'
];

const missingControllers = requiredControllers.filter(name => !searchController[name]);
if (missingControllers.length > 0) {
  console.error('❌ Missing search controllers:', missingControllers.join(', '));
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`Missing controllers: ${missingControllers.join(', ')}`);
  }
}

const { 
  searchQueryValidator, 
  searchSuggestionsValidator,
  advancedSearchValidator 
} = require('../utils/validators/searchValidator');
const { generalLimiter } = require('../middleware/rateLimiter');
const { cacheMiddleware } = require('../middleware/cache');
const { trackIP } = require('../middleware/ipTracker');

// ============================================
// Public Routes
// ============================================
router.use(generalLimiter);
router.use(trackIP);

// Basic search - Cache for 10 minutes (shorter for search)
router.get('/', searchQueryValidator, cacheMiddleware(600), searchBlogs);

// Search suggestions (autocomplete) - Cache for 1 hour
router.get('/suggestions', searchSuggestionsValidator, cacheMiddleware(3600), searchSuggestions);

// Advanced search - POST requests shouldn't be cached
router.post('/advanced', advancedSearchValidator, advancedSearch);

module.exports = router;