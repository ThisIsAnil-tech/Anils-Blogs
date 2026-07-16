const UAParser = require('ua-parser-js');
const logger = require('../utils/logger');

// @desc    Parse device info from user agent
const parseDeviceInfo = (userAgent) => {
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      device: {
        type: result.device.type || 'desktop',
        model: result.device.model || 'Unknown',
        vendor: result.device.vendor || 'Unknown'
      },
      browser: {
        name: result.browser.name || 'Unknown',
        version: result.browser.version || 'Unknown',
        major: result.browser.major || 'Unknown'
      },
      os: {
        name: result.os.name || 'Unknown',
        version: result.os.version || 'Unknown'
      },
      engine: {
        name: result.engine.name || 'Unknown',
        version: result.engine.version || 'Unknown'
      },
      cpu: {
        architecture: result.cpu.architecture || 'Unknown'
      },
      userAgent: userAgent,
      isMobile: ['mobile', 'tablet'].includes(result.device.type),
      isTablet: result.device.type === 'tablet',
      isDesktop: result.device.type === 'desktop' || !result.device.type,
      isBot: result.device.type === 'bot',
      screenResolution: null, // Can be set from client-side
      viewport: null // Can be set from client-side
    };
  } catch (error) {
    logger.error(`Device info parse error: ${error.message}`);
    return {
      device: { type: 'unknown', model: 'Unknown', vendor: 'Unknown' },
      browser: { name: 'Unknown', version: 'Unknown', major: 'Unknown' },
      os: { name: 'Unknown', version: 'Unknown' },
      userAgent: userAgent || 'Unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isBot: false
    };
  }
};

// @desc    Middleware to detect device info
const detectDevice = (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseDeviceInfo(userAgent);
    
    // Attach to request
    req.device = deviceInfo;
    
    // Check for mobile device for responsive features
    req.isMobile = deviceInfo.isMobile;
    req.isTablet = deviceInfo.isTablet;
    req.isDesktop = deviceInfo.isDesktop;
    
    next();
  } catch (error) {
    logger.error(`Device detection error: ${error.message}`);
    next();
  }
};

// @desc    Get device info from request
const getDeviceInfo = (req) => {
  return req.device || parseDeviceInfo(req.headers['user-agent']);
};

// @desc    Check if request is from mobile
const isMobile = (req) => {
  return req.isMobile || false;
};

// @desc    Check if request is from tablet
const isTablet = (req) => {
  return req.isTablet || false;
};

// @desc    Check if request is from desktop
const isDesktop = (req) => {
  return req.isDesktop || false;
};

// @desc    Check if request is from bot
const isBot = (req) => {
  return req.device?.isBot || false;
};

// @desc    Get device type
const getDeviceType = (req) => {
  if (req.isMobile) return 'mobile';
  if (req.isTablet) return 'tablet';
  return 'desktop';
};

// @desc    Get browser info
const getBrowserInfo = (req) => {
  return req.device?.browser || { name: 'Unknown', version: 'Unknown' };
};

// @desc    Get OS info
const getOSInfo = (req) => {
  return req.device?.os || { name: 'Unknown', version: 'Unknown' };
};

module.exports = {
  parseDeviceInfo,
  detectDevice,
  getDeviceInfo,
  isMobile,
  isTablet,
  isDesktop,
  isBot,
  getDeviceType,
  getBrowserInfo,
  getOSInfo
};