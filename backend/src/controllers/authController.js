const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { sendApiResponse } = require('../utils/helpers/apiResponse');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const login = async (req, res, next) => {
  try {
    // Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return sendApiResponse(res, 401, false, 'Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked()) {
      return sendApiResponse(res, 401, false, 'Account is locked. Please try again later');
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      await user.incrementLoginAttempts();
      return sendApiResponse(res, 401, false, 'Invalid credentials');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = user.toObject();
    delete userData.password;

    sendApiResponse(res, 200, true, 'Login successful', {
      user: userData,
      token
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendApiResponse(res, 404, false, 'User not found');
    }

    sendApiResponse(res, 200, true, 'Profile fetched successfully', user);
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, socialLinks, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendApiResponse(res, 404, false, 'User not found');
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;
    if (socialLinks) user.socialLinks = socialLinks;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    sendApiResponse(res, 200, true, 'Profile updated successfully', user);
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/admin/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return sendApiResponse(res, 404, false, 'User not found');
    }

    // Check current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return sendApiResponse(res, 401, false, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendApiResponse(res, 200, true, 'Password changed successfully');
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/admin/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    // Invalidate token on client side
    sendApiResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};