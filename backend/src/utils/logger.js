const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0 && meta.message !== message) {
      // Remove duplicate message if present
      const { message: msg, ...rest } = meta;
      if (Object.keys(rest).length > 0) {
        log += `\n${JSON.stringify(rest, null, 2)}`;
      }
    }
    
    return log;
  })
);

// Define console format (colorized)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0 && meta.message !== message) {
      const { message: msg, ...rest } = meta;
      if (Object.keys(rest).length > 0) {
        log += `\n${JSON.stringify(rest, null, 2)}`;
      }
    }
    
    return log;
  })
);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Write HTTP logs to http.log
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Write debug logs to debug.log (only in development)
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.File({
        filename: path.join(logDir, 'debug.log'),
        level: 'debug',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: logFormat
      })
    ] : [])
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
} else {
  // In production, only log info and above to console
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'info'
  }));
}

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Custom methods for specific logging needs

/**
 * Log API request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'] || req.headers['referrer']
  };

  if (res.statusCode >= 500) {
    logger.error('API Request Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('API Request Error', logData);
  } else if (res.statusCode >= 300) {
    logger.warn('API Request Redirect', logData);
  } else {
    logger.http('API Request', logData);
  }
};

/**
 * Log database operation
 * @param {string} operation - Database operation
 * @param {string} collection - Collection name
 * @param {Object} data - Operation data
 * @param {number} duration - Operation duration in ms
 */
logger.logDatabase = (operation, collection, data = {}, duration) => {
  const logData = {
    operation,
    collection,
    ...data,
    duration: duration ? `${duration}ms` : undefined
  };

  logger.debug('Database Operation', logData);
};

/**
 * Log external service call
 * @param {string} service - Service name
 * @param {string} action - Action performed
 * @param {Object} data - Service call data
 * @param {number} duration - Call duration in ms
 */
logger.logService = (service, action, data = {}, duration) => {
  const logData = {
    service,
    action,
    ...data,
    duration: duration ? `${duration}ms` : undefined
  };

  logger.info('External Service Call', logData);
};

/**
 * Log authentication event
 * @param {string} event - Authentication event (login, logout, etc.)
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {Object} meta - Additional metadata
 */
logger.logAuth = (event, userId, username, meta = {}) => {
  const logData = {
    event,
    userId,
    username,
    ...meta
  };

  logger.info('Authentication Event', logData);
};

/**
 * Log security event
 * @param {string} event - Security event
 * @param {string} ip - IP address
 * @param {Object} meta - Additional metadata
 */
logger.logSecurity = (event, ip, meta = {}) => {
  const logData = {
    event,
    ip,
    ...meta
  };

  logger.warn('Security Event', logData);
};

/**
 * Log system event
 * @param {string} event - System event
 * @param {Object} meta - Additional metadata
 */
logger.logSystem = (event, meta = {}) => {
  const logData = {
    event,
    ...meta
  };

  logger.info('System Event', logData);
};

/**
 * Log email event
 * @param {string} event - Email event (sent, failed, etc.)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {Object} meta - Additional metadata
 */
logger.logEmail = (event, to, subject, meta = {}) => {
  const logData = {
    event,
    to,
    subject,
    ...meta
  };

  logger.info('Email Event', logData);
};

/**
 * Log performance metric
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Metric unit
 * @param {Object} meta - Additional metadata
 */
logger.logPerformance = (metric, value, unit = 'ms', meta = {}) => {
  const logData = {
    metric,
    value,
    unit,
    ...meta
  };

  logger.verbose('Performance Metric', logData);
};

// Log startup
logger.info(`🚀 Logger initialized in ${process.env.NODE_ENV || 'development'} mode`);

module.exports = logger;