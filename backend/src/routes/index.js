const express = require('express');
const router = express.Router();

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

// Register routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/blogs`, blogRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/comments`, commentRoutes);
router.use(`${API_VERSION}/subscribers`, subscriberRoutes);
router.use(`${API_VERSION}/likes`, likeRoutes);
router.use(`${API_VERSION}/shares`, shareRoutes);
router.use(`${API_VERSION}/media`, mediaRoutes);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
router.use(`${API_VERSION}/tags`, tagRoutes);
router.use(`${API_VERSION}/search`, searchRoutes);
router.use(`${API_VERSION}/settings`, settingsRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API documentation route
router.get('/api-docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/v1/auth',
        endpoints: ['POST /login', 'GET /profile', 'PUT /profile', 'PUT /change-password', 'POST /logout']
      },
      blogs: {
        base: '/api/v1/blogs',
        endpoints: ['GET /', 'GET /popular', 'GET /recent', 'GET /:slug']
      },
      admin: {
        base: '/api/v1/admin',
        endpoints: ['POST /blogs', 'PUT /blogs/:id', 'DELETE /blogs/:id', 'POST /blogs/:id/notify', 'GET /comments/pending', 'PUT /comments/:id/approve', 'PUT /comments/:id/reject']
      },
      comments: {
        base: '/api/v1/comments',
        endpoints: ['GET /:blogId', 'POST /:blogId', 'PUT /:id', 'DELETE /:id']
      },
      subscribers: {
        base: '/api/v1/subscribers',
        endpoints: ['POST /', 'GET /verify/:token', 'POST /unsubscribe', 'GET /preferences/:token', 'PUT /preferences/:token']
      },
      likes: {
        base: '/api/v1/likes',
        endpoints: ['POST /:blogId', 'GET /:blogId/check', 'GET /:blogId/count']
      },
      shares: {
        base: '/api/v1/shares',
        endpoints: ['POST /:blogId', 'GET /:blogId/count']
      },
      media: {
        base: '/api/v1/media',
        endpoints: ['POST /image', 'POST /images', 'POST /video', 'DELETE /:publicId']
      },
      dashboard: {
        base: '/api/v1/dashboard',
        endpoints: ['GET /', 'GET /analytics', 'GET /analytics/comprehensive', 'GET /analytics/realtime', 'GET /analytics/content', 'GET /analytics/engagement', 'GET /analytics/subscribers', 'GET /analytics/performance', 'GET /analytics/predictions', 'GET /analytics/export']
      },
      categories: {
        base: '/api/v1/categories',
        endpoints: ['GET /', 'GET /:slug', 'GET /:slug/blogs', 'POST /', 'PUT /:id', 'DELETE /:id']
      },
      tags: {
        base: '/api/v1/tags',
        endpoints: ['GET /', 'GET /popular', 'GET /:slug', 'GET /:slug/blogs', 'POST /', 'PUT /:id', 'DELETE /:id']
      },
      search: {
        base: '/api/v1/search',
        endpoints: ['GET /', 'GET /suggestions', 'POST /advanced']
      },
      settings: {
        base: '/api/v1/settings',
        endpoints: ['GET /', 'PUT /', 'GET /social', 'PUT /social', 'GET /email', 'PUT /email', 'GET /security', 'PUT /security', 'GET /analytics', 'PUT /analytics', 'GET /backup', 'PUT /backup']
      }
    }
  });
});

module.exports = router;