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

// Initialize express app
const app = express();

// Initialize Redis asynchronously (non-blocking)
const initRedis = async () => {
  try {
    const { connectRedis } = require('./config/redis');
    const client = await connectRedis();
    if (client) {
      logger.info('✅ Redis initialization complete');
    } else {
      logger.info('ℹ️  Redis not enabled');
    }
  } catch (err) {
    logger.warn(`Redis initialization failed: ${err.message}`);
  }
};

// Don't await - let it run in background
initRedis();

// =====================
// Security Middleware
// =====================

// Helmet - Security headers with production-safe settings
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: { policy: process.env.NODE_ENV === 'production' ? "cross-origin" : "same-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production',
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
};

app.use(helmet(helmetConfig));

// =====================
// CORS Configuration
// =====================

const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

// In production, require CORS origins to be set
if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
  logger.warn('⚠️  CORS_ORIGIN not set in production. Using restrictive defaults.');
  corsOrigins.push('http://localhost:3000', 'http://localhost:5000');
}

const corsOptions = {
  origin: corsOrigins.length > 0 ? corsOrigins : '*',
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

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

// Morgan logging with proper error handling
app.use(morgan('combined', { 
  stream: accessLogStream,
  skip: (req) => req.path === '/health'
}));

// Console logging in development only
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Custom request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (req.path !== '/health') {
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
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
// Static Files with Security
// =====================

// Serve static files with security headers
const serveStaticOptions = {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent direct access to sensitive files
    if (path.includes('.env') || path.includes('.git')) {
      res.status(403).end('Forbidden');
    }
  }
};

// Cloudinary webhook endpoint
app.route('/api/webhooks/cloudinary')
  .get((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Cloudinary webhook endpoint is active. Send a POST request to trigger it.'
    });
  })
  .post(express.json(), (req, res) => {
    logger.info('Cloudinary webhook received', { body: req.body });
    // Process the notification
    res.status(200).send('OK');
  });

// Serve uploads with security
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), serveStaticOptions));
app.use('/public', express.static(path.join(__dirname, '../public'), serveStaticOptions));

// =====================
// Health Check
// =====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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
// Export App
// =====================

module.exports = app;