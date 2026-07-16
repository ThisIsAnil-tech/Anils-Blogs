const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics
} = require('../controllers/dashboardController');
const {
  getComprehensiveAnalytics,
  getRealTimeAnalytics,
  getContentAnalytics,
  getEngagementAnalytics,
  getSubscriberAnalytics,
  exportAnalytics,
  getPerformanceMetrics,
  getPredictiveAnalytics
} = require('../controllers/analyticsController');
const { protect, isAdmin } = require('../middleware/auth');
const { analyticsValidation } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

// All dashboard routes are protected (Admin only)
router.use(protect);
router.use(isAdmin);
router.use(generalLimiter);

// Dashboard overview
router.get('/', getDashboardStats);

// Analytics endpoints
router.get('/analytics', analyticsValidation, getAnalytics);
router.get('/analytics/comprehensive', analyticsValidation, getComprehensiveAnalytics);
router.get('/analytics/realtime', getRealTimeAnalytics);
router.get('/analytics/content', analyticsValidation, getContentAnalytics);
router.get('/analytics/engagement', analyticsValidation, getEngagementAnalytics);
router.get('/analytics/subscribers', analyticsValidation, getSubscriberAnalytics);
router.get('/analytics/performance', analyticsValidation, getPerformanceMetrics);
router.get('/analytics/predictions', analyticsValidation, getPredictiveAnalytics);

// Export analytics
router.get('/analytics/export', analyticsValidation, exportAnalytics);

module.exports = router;