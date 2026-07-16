const express = require('express');
const router = express.Router();

// Import controllers
const settingsController = require('../controllers/settingsController');

// Destructure with fallbacks
const {
  getSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getSocialSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateSocialSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getEmailSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateEmailSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getSecuritySettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateSecuritySettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getAnalyticsSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateAnalyticsSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getBackupSettings = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateBackupSettings = (req, res) => res.status(501).json({ message: 'Not implemented' })
} = settingsController;

const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

// ============================================
// Admin Routes (All protected)
// ============================================
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