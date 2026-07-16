const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { trackIP } = require('./middleware/ipTracker');
const { detectDevice } = require('./middleware/deviceInfo');

// Import routes
const routes = require('./routes');

// Import logger
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');

// Initialize express app
const app = express();

connectRedis().then(() => {
  logger.info('Redis initialization complete');
}).catch((err) => {
  logger.warn(`Redis initialization failed: ${err.message}`);
});

// =====================
// Security Middleware
// =====================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// =====================
// CORS Configuration
// =====================

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-api-key'],
  exposedHeaders: ['X-Total-Count', 'X-Pagination-Page', 'X-Pagination-Limit', 'X-Pagination-Total'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// =====================
// Compression
// =====================

app.use(compression({
  level: 6,
  threshold: 1024, // Compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// =====================
// Logging
// =====================

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../logs/access.log'),
  { flags: 'a' }
);

// Morgan logging
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Console logging in development

// Custom request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// =====================
// Body Parsers
// =====================

// JSON parser
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// URL encoded parser
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// =====================
// IP Tracking
// =====================

app.use(trackIP);

// =====================
// Device Detection
// =====================

app.use(detectDevice);

// =====================
// Rate Limiting
// =====================

// General rate limiter for all requests
app.use(generalLimiter);

// =====================
// Static Files
// =====================

app.post('/api/webhooks/cloudinary', express.json(), (req, res) => {
  console.log('Webhook received:', req.body);
  // Process the notification
  res.status(200).send('OK');
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// =====================
// Health Check
// =====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

// =====================
// API Routes
// =====================

// Mount all routes
app.use('/', routes);

// =====================
// API Documentation Route
// =====================

app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Blog Management API',
    version: '1.0.0',
    description: 'Complete Blog Management System API',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/v1/auth',
      blogs: '/api/v1/blogs',
      admin: '/api/v1/admin',
      comments: '/api/v1/comments',
      subscribers: '/api/v1/subscribers',
      likes: '/api/v1/likes',
      shares: '/api/v1/shares',
      media: '/api/v1/media',
      dashboard: '/api/v1/dashboard',
      categories: '/api/v1/categories',
      tags: '/api/v1/tags',
      search: '/api/v1/search',
      settings: '/api/v1/settings'
    },
    health: '/health'
  });
});

// =====================
// Swagger Documentation (if enabled)
// =====================

if (process.env.SWAGGER_ENABLED === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerDocument = require('../swagger.json');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logger.info('📚 Swagger documentation enabled at /api-docs');
  } catch (error) {
    logger.warn('Swagger documentation not available');
  }
}

// =====================
// Error Handling
// =====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =====================
// Unhandled Rejection & Exception Handling
// =====================

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// =====================
// Graceful Shutdown
// =====================

const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Closing server gracefully...');
  // Close database connections, Redis, etc.
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// =====================
// Export App
// =====================

module.exports = app;