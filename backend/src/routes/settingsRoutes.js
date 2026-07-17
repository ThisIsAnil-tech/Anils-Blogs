const express = require('express');
const router = express.Router();

// Import controllers
const settingsController = require('../controllers/settingsController');

// Destructure with proper validation - NO FALLBACKS
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
} = settingsController;

// Validate that all required controllers exist
const requiredControllers = [
  'getSettings',
  'updateSettings',
  'getSocialSettings',
  'updateSocialSettings',
  'getEmailSettings',
  'updateEmailSettings',
  'getSecuritySettings',
  'updateSecuritySettings',
  'getAnalyticsSettings',
  'updateAnalyticsSettings',
  'getBackupSettings',
  'updateBackupSettings'
];

const missingControllers = requiredControllers.filter(name => !settingsController[name]);
if (missingControllers.length > 0) {
  console.error('❌ Missing settings controllers:', missingControllers.join(', '));
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`Missing controllers: ${missingControllers.join(', ')}`);
  }
}

const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const { logAdminActivity } = require('../middleware/adminAuth');
const { 
  generalSettingsValidator,
  socialSettingsValidator,
  emailSettingsValidator,
  securitySettingsValidator,
  analyticsSettingsValidator,
  backupSettingsValidator
} = require('../utils/validators/settingsValidator');

// ============================================
// Admin Routes (All protected)
// ============================================
router.use(protect);
router.use(isAdmin);
router.use(logAdminActivity('Settings Action'));
router.use(generalLimiter);

// General settings
router.get('/', getSettings);
router.put('/', generalSettingsValidator, updateSettings);

// Social settings
router.get('/social', getSocialSettings);
router.put('/social', socialSettingsValidator, updateSocialSettings);

// Email settings
router.get('/email', getEmailSettings);
router.put('/email', emailSettingsValidator, updateEmailSettings);

// Security settings
router.get('/security', getSecuritySettings);
router.put('/security', securitySettingsValidator, updateSecuritySettings);

// Analytics settings
router.get('/analytics', getAnalyticsSettings);
router.put('/analytics', analyticsSettingsValidator, updateAnalyticsSettings);

// Backup settings
router.get('/backup', getBackupSettings);
router.put('/backup', backupSettingsValidator, updateBackupSettings);

module.exports = router;