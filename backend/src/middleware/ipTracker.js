const logger = require('../utils/logger');

// @desc    Track IP address
const trackIP = (req, res, next) => {
  try {
    // Get IP from various sources
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.ip;
    
    // Store in request for later use
    req.clientIp = ip;
    
    // Get location info if needed (using IP geolocation API)
    // This can be extended with IP geolocation services
    
    next();
  } catch (error) {
    logger.error(`IP tracking error: ${error.message}`);
    next();
  }
};

// @desc    Get IP from request
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         '0.0.0.0';
};

// @desc    Check if IP is in whitelist
const isIPWhitelisted = (ip, whitelist) => {
  if (!whitelist || whitelist.length === 0) return true;
  return whitelist.includes(ip);
};

// @desc    Check if IP is in blacklist
const isIPBlacklisted = (ip, blacklist) => {
  if (!blacklist || blacklist.length === 0) return false;
  return blacklist.includes(ip);
};

// @desc    IP blacklist middleware
const ipBlacklist = (blacklist) => {
  return (req, res, next) => {
    const ip = getClientIP(req);
    if (isIPBlacklisted(ip, blacklist)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

// @desc    IP whitelist middleware
const ipWhitelist = (whitelist) => {
  return (req, res, next) => {
    const ip = getClientIP(req);
    if (!isIPWhitelisted(ip, whitelist)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

// @desc    Track unique visitors
const trackUniqueVisitor = async (req, res, next) => {
  try {
    const ip = getClientIP(req);
    const sessionId = req.session?.id || req.headers['x-session-id'];
    
    // Track visitor in Redis or database
    // Example: await redis.sadd('visitors:today', ip);
    // Example: await redis.setex(`visitor:${ip}`, 86400, 'active');
    
    next();
  } catch (error) {
    logger.error(`Track unique visitor error: ${error.message}`);
    next();
  }
};

// @desc    Get visitor statistics
const getVisitorStats = async () => {
  // Implement with Redis or database
  return {
    today: 0,
    week: 0,
    month: 0,
    total: 0
  };
};

module.exports = {
  trackIP,
  getClientIP,
  isIPWhitelisted,
  isIPBlacklisted,
  ipBlacklist,
  ipWhitelist,
  trackUniqueVisitor,
  getVisitorStats
};