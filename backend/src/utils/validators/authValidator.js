const { body, param, query } = require('express-validator');

/**
 * Login validation rules
 */
const loginValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isString().withMessage('Username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * Register validation rules
 */
const registerValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isString().withMessage('Username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

/**
 * Change password validation rules
 */
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required')
    .isString().withMessage('Current password must be a string'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isString().withMessage('New password must be a string')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm new password is required')
    .custom((value, { req }) => value === req.body.newPassword).withMessage('New passwords do not match')
];

/**
 * Forgot password validation rules
 */
const forgotPasswordValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Reset password validation rules
 */
const resetPasswordValidator = [
  param('token')
    .notEmpty().withMessage('Reset token is required')
    .isString().withMessage('Reset token must be a string'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

/**
 * Refresh token validation rules
 */
const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string')
];

/**
 * Profile update validation rules
 */
const profileUpdateValidator = [
  body('fullName')
    .optional()
    .isString().withMessage('Full name must be a string')
    .trim()
    .isLength({ max: 50 }).withMessage('Full name cannot exceed 50 characters'),
  
  body('bio')
    .optional()
    .isString().withMessage('Bio must be a string')
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  
  body('profilePicture')
    .optional()
    .isURL().withMessage('Profile picture must be a valid URL'),
  
  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),
  
  body('socialLinks.twitter')
    .optional()
    .isURL().withMessage('Twitter URL must be valid'),
  
  body('socialLinks.facebook')
    .optional()
    .isURL().withMessage('Facebook URL must be valid'),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL().withMessage('LinkedIn URL must be valid'),
  
  body('socialLinks.instagram')
    .optional()
    .isURL().withMessage('Instagram URL must be valid'),
  
  body('socialLinks.github')
    .optional()
    .isURL().withMessage('GitHub URL must be valid'),
  
  body('preferences')
    .optional()
    .isObject().withMessage('Preferences must be an object'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh']).withMessage('Invalid language preference'),
  
  body('preferences.emailNotifications')
    .optional()
    .isBoolean().withMessage('Email notifications must be a boolean')
];

module.exports = {
  loginValidator,
  registerValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
  profileUpdateValidator
};