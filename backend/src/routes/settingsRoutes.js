const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getSocialSettings,
  updateSocialSettings,
  getEmailSettings,
  updateEmailSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getAnalyticsSettings,
  updateAnalyticsSettings,
  getBackupSettings,
  updateBackupSettings
} = require('../controllers/settingsController');
const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

// All settings routes are protected (Admin only)
router.use(protect);
router.use(isAdmin);
router.use(generalLimiter);

// General settings
router.get('/', getSettings);
router.put('/', updateSettings);

// Social settings
router.get('/social', getSocialSettings);
router.put('/social', updateSocialSettings);

// Email settings
router.get('/email', getEmailSettings);
router.put('/email', updateEmailSettings);

// Security settings
router.get('/security', getSecuritySettings);
router.put('/security', updateSecuritySettings);

// Analytics settings
router.get('/analytics', getAnalyticsSettings);
router.put('/analytics', updateAnalyticsSettings);

// Backup settings
router.get('/backup', getBackupSettings);
router.put('/backup', updateBackupSettings);

module.exports = router;