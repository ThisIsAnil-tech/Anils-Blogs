const User = require('../models/User');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendApiResponse(res, 401, false, 'Not authorized');
    }

    // Check if admin
    if (req.user.role !== 'admin') {
      return sendApiResponse(res, 403, false, 'Admin access required');
    }

    // Check if account is active
    if (!req.user.isActive) {
      return sendApiResponse(res, 403, false, 'Account is deactivated');
    }

    next();
  } catch (error) {
    logger.error(`Check admin error: ${error.message}`);
    next(error);
  }
};

// @desc    Check if user is admin or editor
const checkAdminOrEditor = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendApiResponse(res, 401, false, 'Not authorized');
    }

    if (!['admin', 'editor'].includes(req.user.role)) {
      return sendApiResponse(res, 403, false, 'Admin or editor access required');
    }

    if (!req.user.isActive) {
      return sendApiResponse(res, 403, false, 'Account is deactivated');
    }

    next();
  } catch (error) {
    logger.error(`Check admin or editor error: ${error.message}`);
    next(error);
  }
};

// @desc    Log admin activity
const logAdminActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'admin') {
        logger.info(`Admin Activity: ${req.user.username} - ${action} - ${req.method} ${req.originalUrl}`);
        
        // Store in database if needed
        // await AdminLog.create({
        //   admin: req.user._id,
        //   action,
        //   ip: req.ip,
        //   userAgent: req.headers['user-agent'],
        //   timestamp: new Date()
        // });
      }
      next();
    } catch (error) {
      logger.error(`Log admin activity error: ${error.message}`);
      next();
    }
  };
};

module.exports = {
  checkAdmin,
  checkAdminOrEditor,
  logAdminActivity
};