const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Import all route files
const authRoutes = require('./authRoutes');
const blogRoutes = require('./blogRoutes');
const adminRoutes = require('./adminRoutes');
const commentRoutes = require('./commentRoutes');
const subscriberRoutes = require('./subscriberRoutes');
const likeRoutes = require('./likeRoutes');
const shareRoutes = require('./shareRoutes');
const mediaRoutes = require('./mediaRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const categoryRoutes = require('./categoryRoutes');
const tagRoutes = require('./tagRoutes');
const searchRoutes = require('./searchRoutes');
const settingsRoutes = require('./settingsRoutes');

// API version prefix
const API_VERSION = '/api/v1';

// Register routes with error handling
const registerRoute = (path, route) => {
  try {
    router.use(path, route);
    logger.debug(`✅ Route registered: ${path}`);
  } catch (error) {
    logger.error(`❌ Failed to register route ${path}: ${error.message}`);
  }
};

// Register all routes
registerRoute(`${API_VERSION}/auth`, authRoutes);
registerRoute(`${API_VERSION}/blogs`, blogRoutes);
registerRoute(`${API_VERSION}/admin`, adminRoutes);
registerRoute(`${API_VERSION}/comments`, commentRoutes);
registerRoute(`${API_VERSION}/subscribers`, subscriberRoutes);
registerRoute(`${API_VERSION}/likes`, likeRoutes);
registerRoute(`${API_VERSION}/shares`, shareRoutes);
registerRoute(`${API_VERSION}/media`, mediaRoutes);
registerRoute(`${API_VERSION}/dashboard`, dashboardRoutes);
registerRoute(`${API_VERSION}/categories`, categoryRoutes);
registerRoute(`${API_VERSION}/tags`, tagRoutes);
registerRoute(`${API_VERSION}/search`, searchRoutes);
registerRoute(`${API_VERSION}/settings`, settingsRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation route
router.get('/api-docs', (req, res) => {
  const endpoints = {
    auth: {
      base: '/api/v1/auth',
      endpoints: [
        { method: 'POST', path: '/login', description: 'Admin login' },
        { method: 'GET', path: '/profile', description: 'Get admin profile' },
        { method: 'PUT', path: '/profile', description: 'Update admin profile' },
        { method: 'PUT', path: '/change-password', description: 'Change admin password' },
        { method: 'POST', path: '/logout', description: 'Admin logout' }
      ]
    },
    blogs: {
      base: '/api/v1/blogs',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get all published blogs' },
        { method: 'GET', path: '/popular', description: 'Get popular blogs' },
        { method: 'GET', path: '/recent', description: 'Get recent blogs' },
        { method: 'GET', path: '/:slug', description: 'Get blog by slug' }
      ]
    },
    admin: {
      base: '/api/v1/admin',
      endpoints: [
        { method: 'POST', path: '/blogs', description: 'Create new blog' },
        { method: 'PUT', path: '/blogs/:id', description: 'Update blog' },
        { method: 'DELETE', path: '/blogs/:id', description: 'Delete blog' },
        { method: 'POST', path: '/blogs/:id/notify', description: 'Notify subscribers' },
        { method: 'GET', path: '/comments/pending', description: 'Get pending comments' },
        { method: 'PUT', path: '/comments/:id/approve', description: 'Approve comment' },
        { method: 'PUT', path: '/comments/:id/reject', description: 'Reject comment' }
      ]
    },
    comments: {
      base: '/api/v1/comments',
      endpoints: [
        { method: 'GET', path: '/:blogId', description: 'Get blog comments' },
        { method: 'POST', path: '/:blogId', description: 'Add comment' },
        { method: 'PUT', path: '/:id', description: 'Update comment' },
        { method: 'DELETE', path: '/:id', description: 'Delete comment' }
      ]
    },
    subscribers: {
      base: '/api/v1/subscribers',
      endpoints: [
        { method: 'POST', path: '/', description: 'Subscribe to blog' },
        { method: 'GET', path: '/verify/:token', description: 'Verify email' },
        { method: 'POST', path: '/unsubscribe', description: 'Unsubscribe' },
        { method: 'GET', path: '/preferences/:token', description: 'Get preferences' },
        { method: 'PUT', path: '/preferences/:token', description: 'Update preferences' }
      ]
    },
    likes: {
      base: '/api/v1/likes',
      endpoints: [
        { method: 'POST', path: '/:blogId', description: 'Toggle like' },
        { method: 'GET', path: '/:blogId/check', description: 'Check like status' },
        { method: 'GET', path: '/:blogId/count', description: 'Get like count' }
      ]
    },
    shares: {
      base: '/api/v1/shares',
      endpoints: [
        { method: 'POST', path: '/:blogId', description: 'Share blog' },
        { method: 'GET', path: '/:blogId/count', description: 'Get share count' }
      ]
    },
    media: {
      base: '/api/v1/media',
      endpoints: [
        { method: 'POST', path: '/image', description: 'Upload image' },
        { method: 'POST', path: '/images', description: 'Upload multiple images' },
        { method: 'POST', path: '/video', description: 'Upload video' },
        { method: 'DELETE', path: '/:publicId', description: 'Delete media' }
      ]
    },
    dashboard: {
      base: '/api/v1/dashboard',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get dashboard stats' },
        { method: 'GET', path: '/analytics', description: 'Get analytics' }
      ]
    },
    categories: {
      base: '/api/v1/categories',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get all categories' },
        { method: 'GET', path: '/:slug', description: 'Get category by slug' },
        { method: 'GET', path: '/:slug/blogs', description: 'Get blogs in category' },
        { method: 'POST', path: '/', description: 'Create category (admin)' },
        { method: 'PUT', path: '/:id', description: 'Update category (admin)' },
        { method: 'DELETE', path: '/:id', description: 'Delete category (admin)' }
      ]
    },
    tags: {
      base: '/api/v1/tags',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get all tags' },
        { method: 'GET', path: '/popular', description: 'Get popular tags' },
        { method: 'GET', path: '/:slug', description: 'Get tag by slug' },
        { method: 'GET', path: '/:slug/blogs', description: 'Get blogs with tag' },
        { method: 'POST', path: '/', description: 'Create tag (admin)' },
        { method: 'PUT', path: '/:id', description: 'Update tag (admin)' },
        { method: 'DELETE', path: '/:id', description: 'Delete tag (admin)' }
      ]
    },
    search: {
      base: '/api/v1/search',
      endpoints: [
        { method: 'GET', path: '/', description: 'Search blogs' },
        { method: 'GET', path: '/suggestions', description: 'Get search suggestions' },
        { method: 'POST', path: '/advanced', description: 'Advanced search' }
      ]
    },
    settings: {
      base: '/api/v1/settings',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get all settings' },
        { method: 'PUT', path: '/', description: 'Update settings' },
        { method: 'GET', path: '/social', description: 'Get social settings' },
        { method: 'PUT', path: '/social', description: 'Update social settings' },
        { method: 'GET', path: '/email', description: 'Get email settings' },
        { method: 'PUT', path: '/email', description: 'Update email settings' },
        { method: 'GET', path: '/security', description: 'Get security settings' },
        { method: 'PUT', path: '/security', description: 'Update security settings' },
        { method: 'GET', path: '/analytics', description: 'Get analytics settings' },
        { method: 'PUT', path: '/analytics', description: 'Update analytics settings' },
        { method: 'GET', path: '/backup', description: 'Get backup settings' },
        { method: 'PUT', path: '/backup', description: 'Update backup settings' }
      ]
    }
  };

  res.json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    baseUrl: '/api/v1',
    endpoints,
    health: '/health',
    docs: '/api-docs'
  });
});

// ... (all your route imports and registrations)

// 404 handler for routes - FIXED
router.use('/*splat', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;