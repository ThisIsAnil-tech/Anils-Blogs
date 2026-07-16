const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendApiResponse(res, 401, false, 'Not authorized, no token');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return sendApiResponse(res, 401, false, 'Not authorized, user not found');
      }

      if (!user.isActive) {
        return sendApiResponse(res, 401, false, 'Account is deactivated');
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      return sendApiResponse(res, 401, false, 'Not authorized, invalid token');
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    next(error);
  }
};

// @desc    Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendApiResponse(res, 401, false, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      return sendApiResponse(res, 403, false, `User role ${req.user.role} is not authorized to access this route`);
    }

    next();
  };
};

// @desc    Verify admin role
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendApiResponse(res, 401, false, 'Not authorized');
    }

    if (req.user.role !== 'admin') {
      return sendApiResponse(res, 403, false, 'Admin access required');
    }

    next();
  } catch (error) {
    logger.error(`Admin middleware error: ${error.message}`);
    next(error);
  }
};

// @desc    Optional auth (proceed even if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but proceed without user
        logger.warn(`Optional auth: Invalid token`);
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error.message}`);
    next();
  }
};

// @desc    Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendApiResponse(res, 400, false, 'Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return sendApiResponse(res, 401, false, 'Invalid refresh token');
    }

    if (user.refreshTokenExpire && user.refreshTokenExpire < Date.now()) {
      return sendApiResponse(res, 401, false, 'Refresh token expired');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    return sendApiResponse(res, 401, false, 'Invalid refresh token');
  }
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  optionalAuth,
  refreshToken
};