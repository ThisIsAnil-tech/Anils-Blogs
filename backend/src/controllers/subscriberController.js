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
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { username, email, preferences } = req.body;

    // Get IP and device info
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);

    // Check if subscriber already exists
    let subscriber = await Subscriber.findOne({ 
      $or: [
        { email: email.toLowerCase() },
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

    // Create new subscriber
    subscriber = await Subscriber.create({
      username,
      email: email ? email.toLowerCase() : undefined,
      ipAddress: ip,
      deviceInfo,
      preferences,
      status: email ? 'active' : 'active',
      isVerified: email ? false : true,
      verificationToken: email ? generateToken() : undefined,
      subscriptionDate: Date.now()
    });

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
    
    // Get recent growth (last 7 days)
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

// Helper: Parse user agent
function parseUserAgent(userAgent) {
  const info = {
    device: 'Unknown',
    browser: 'Unknown',
    browserVersion: 'Unknown',
    os: 'Unknown',
    osVersion: 'Unknown'
  };

  // Simple parsing
  if (userAgent.includes('Mobile')) info.device = 'Mobile';
  else if (userAgent.includes('Tablet')) info.device = 'Tablet';
  else info.device = 'Desktop';

  if (userAgent.includes('Chrome')) {
    info.browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) info.browserVersion = match[1];
  } else if (userAgent.includes('Firefox')) {
    info.browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) info.browserVersion = match[1];
  } else if (userAgent.includes('Safari')) {
    info.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    info.browser = 'Edge';
  }

  if (userAgent.includes('Windows')) info.os = 'Windows';
  else if (userAgent.includes('Mac')) info.os = 'MacOS';
  else if (userAgent.includes('Linux')) info.os = 'Linux';
  else if (userAgent.includes('Android')) info.os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    info.os = 'iOS';
  }

  return info;
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