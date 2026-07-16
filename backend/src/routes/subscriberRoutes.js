const express = require('express');
const router = express.Router();
const {
  subscribe,
  verifyEmail,
  unsubscribe,
  getPreferences,
  updatePreferences,
  getSubscribers,
  getSubscriberStats
} = require('../controllers/subscriberController');
const {
  subscribeValidation,
  subscriberPreferencesValidation,
  paginationValidation,
  emailValidation
} = require('../middleware/validation');
const { subscribeLimiter } = require('../middleware/rateLimiter');
const { trackIP } = require('../middleware/ipTracker');
const { detectDevice } = require('../middleware/deviceInfo');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.use(trackIP);
router.use(detectDevice);

// Subscribe
router.post('/', subscribeLimiter, subscribeValidation, subscribe);

// Verify email
router.get('/verify/:token', verifyEmail);

// Unsubscribe
router.post('/unsubscribe', unsubscribe);

// Get preferences
router.get('/preferences/:token', getPreferences);

// Update preferences
router.put('/preferences/:token', subscriberPreferencesValidation, updatePreferences);

// Admin routes
router.use(protect);
router.use(isAdmin);

// Get all subscribers
router.get('/admin', paginationValidation, getSubscribers);

// Get subscriber stats
router.get('/admin/stats', getSubscriberStats);

module.exports = router;