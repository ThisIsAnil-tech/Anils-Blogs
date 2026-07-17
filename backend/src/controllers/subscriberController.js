const Subscriber = require('../models/Subscriber');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const { sendWelcomeEmail } = require('../config/email');
const logger = require('../utils/logger');
const crypto = require('crypto');

// @desc    Subscribe to blog
// @route   POST /api/subscribers
// @access  Public
const subscribe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', null, errors.array());
    }

    const { username, email, preferences } = req.body;

    // Get IP and device info
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Parse device info with fallback
    let deviceInfo;
    try {
      deviceInfo = parseUserAgent(userAgent);
    } catch (error) {
      logger.error(`Device info parsing error: ${error.message}`);
      deviceInfo = {
        device: 'Unknown',
        browser: 'Unknown',
        browserVersion: 'Unknown',
        os: 'Unknown',
        osVersion: 'Unknown',
        userAgent: userAgent || 'Unknown'
      };
    }

    // Check if subscriber already exists
    let subscriber = await Subscriber.findOne({ 
      $or: [
        { email: email ? email.toLowerCase() : undefined },
        { ipAddress: ip }
      ]
    });

    if (subscriber) {
      // Reactivate if inactive
      if (subscriber.status === 'inactive' || subscriber.status === 'unsubscribed') {
        subscriber.status = 'active';
        subscriber.isVerified = email ? false : true;
        if (email) {
          subscriber.email = email.toLowerCase();
          subscriber.verificationToken = generateToken();
        }
        subscriber.username = username || subscriber.username;
        subscriber.preferences = { ...subscriber.preferences, ...preferences };
        subscriber.subscriptionDate = Date.now();
        await subscriber.save();
        
        return sendApiResponse(res, 200, true, 'Subscription reactivated', {
          subscriber,
          message: email ? 'Please verify your email' : 'Subscribed successfully'
        });
      }
      
      return sendApiResponse(res, 400, false, 'Already subscribed');
    }

    // Create new subscriber with proper device info
    const subscriberData = {
      username,
      email: email ? email.toLowerCase() : undefined,
      ipAddress: ip,
      deviceInfo: deviceInfo,
      preferences: preferences || {},
      status: 'active',
      isVerified: email ? false : true,
      verificationToken: email ? generateToken() : undefined,
      subscriptionDate: Date.now()
    };

    logger.debug('Creating subscriber with data:', { 
      username, 
      email, 
      ip, 
      deviceInfo: JSON.stringify(deviceInfo) 
    });

    subscriber = await Subscriber.create(subscriberData);

    // Send welcome email if email provided
    if (email) {
      try {
        await sendWelcomeEmail(subscriber);
      } catch (error) {
        logger.error(`Welcome email error: ${error.message}`);
      }
    }

    sendApiResponse(res, 201, true, 'Subscribed successfully', {
      subscriber,
      message: email ? 'Please check your email to verify' : 'Subscribed successfully'
    });
  } catch (error) {
    logger.error(`Subscribe error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    next(error);
  }
};

// @desc    Verify subscriber email
// @route   GET /api/subscribers/verify/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const subscriber = await Subscriber.findOne({
      verificationToken: hashedToken
    });

    if (!subscriber) {
      return sendApiResponse(res, 400, false, 'Invalid verification token');
    }

    subscriber.isVerified = true;
    subscriber.verificationToken = undefined;
    await subscriber.save();

    sendApiResponse(res, 200, true, 'Email verified successfully');
  } catch (error) {
    logger.error(`Verify email error: ${error.message}`);
    next(error);
  }
};

// @desc    Unsubscribe
// @route   POST /api/subscribers/unsubscribe
// @access  Public
const unsubscribe = async (req, res, next) => {
  try {
    const { email, ip } = req.body;

    const query = email ? { email: email.toLowerCase() } : { ipAddress: ip };
    const subscriber = await Subscriber.findOne(query);

    if (!subscriber) {
      return sendApiResponse(res, 404, false, 'Subscriber not found');
    }

    subscriber.status = 'unsubscribed';
    subscriber.unsubscribeReason = req.body.reason || '';
    subscriber.unsubscribeToken = undefined;
    await subscriber.save();

    sendApiResponse(res, 200, true, 'Unsubscribed successfully');
  } catch (error) {
    logger.error(`Unsubscribe error: ${error.message}`);
    next(error);
  }
};

// @desc    Get subscriber preferences
// @route   GET /api/subscribers/preferences/:token
// @access  Public
const getPreferences = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const subscriber = await Subscriber.findOne({
      unsubscribeToken: hashedToken
    });

    if (!subscriber) {
      return sendApiResponse(res, 404, false, 'Subscriber not found');
    }

    sendApiResponse(res, 200, true, 'Preferences fetched', {
      preferences: subscriber.preferences
    });
  } catch (error) {
    logger.error(`Get preferences error: ${error.message}`);
    next(error);
  }
};

// @desc    Update subscriber preferences
// @route   PUT /api/subscribers/preferences/:token
// @access  Public
const updatePreferences = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const subscriber = await Subscriber.findOne({
      unsubscribeToken: hashedToken
    });

    if (!subscriber) {
      return sendApiResponse(res, 404, false, 'Subscriber not found');
    }

    subscriber.preferences = { ...subscriber.preferences, ...preferences };
    await subscriber.save();

    sendApiResponse(res, 200, true, 'Preferences updated successfully');
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    next(error);
  }
};

// @desc    Get all subscribers (Admin only)
// @route   GET /api/admin/subscribers
// @access  Private/Admin
const getSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const subscribers = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Subscriber.countDocuments(query);

    sendApiResponse(res, 200, true, 'Subscribers fetched successfully', {
      subscribers,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Get subscribers error: ${error.message}`);
    next(error);
  }
};

// @desc    Get subscriber stats (Admin only)
// @route   GET /api/admin/subscribers/stats
// @access  Private/Admin
const getSubscriberStats = async (req, res, next) => {
  try {
    const stats = await Subscriber.getStats();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentGrowth = await Subscriber.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    sendApiResponse(res, 200, true, 'Subscriber stats fetched', {
      ...stats,
      recentGrowth
    });
  } catch (error) {
    logger.error(`Get subscriber stats error: ${error.message}`);
    next(error);
  }
};

// Helper: Parse user agent with proper error handling
function parseUserAgent(userAgent) {
  try {
    const info = {
      device: 'Unknown',
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
      osVersion: 'Unknown',
      userAgent: userAgent || 'Unknown'
    };

    if (!userAgent || userAgent === 'Unknown') {
      return info;
    }

    // Simple parsing
    const ua = userAgent.toLowerCase();

    // Detect device
    if (ua.includes('mobile')) info.device = 'Mobile';
    else if (ua.includes('tablet')) info.device = 'Tablet';
    else info.device = 'Desktop';

    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg')) {
      info.browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      if (match) info.browserVersion = match[1];
    } else if (ua.includes('firefox')) {
      info.browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      if (match) info.browserVersion = match[1];
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      info.browser = 'Safari';
    } else if (ua.includes('edg')) {
      info.browser = 'Edge';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      info.browser = 'Opera';
    }

    // Detect OS
    if (ua.includes('windows')) {
      info.os = 'Windows';
      const match = userAgent.match(/Windows NT (\d+\.\d+)/);
      if (match) info.osVersion = match[1];
    } else if (ua.includes('mac os')) {
      info.os = 'MacOS';
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      if (match) info.osVersion = match[1].replace('_', '.');
    } else if (ua.includes('linux') && !ua.includes('android')) {
      info.os = 'Linux';
    } else if (ua.includes('android')) {
      info.os = 'Android';
      const match = userAgent.match(/Android (\d+\.\d+)/);
      if (match) info.osVersion = match[1];
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      info.os = 'iOS';
      const match = userAgent.match(/OS (\d+[._]\d+)/);
      if (match) info.osVersion = match[1].replace('_', '.');
    }

    return info;
  } catch (error) {
    logger.error(`Parse user agent error: ${error.message}`);
    return {
      device: 'Unknown',
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
      osVersion: 'Unknown',
      userAgent: userAgent || 'Unknown'
    };
  }
}

// Helper: Generate token
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  subscribe,
  verifyEmail,
  unsubscribe,
  getPreferences,
  updatePreferences,
  getSubscribers,
  getSubscriberStats
};