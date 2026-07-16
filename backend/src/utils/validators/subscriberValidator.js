const { body, param, query } = require('express-validator');

/**
 * Create subscriber validation rules
 */
const createSubscriberValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isString().withMessage('Username must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_\s]+$/).withMessage('Username can only contain letters, numbers, underscores and spaces'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('preferences')
    .optional()
    .isObject().withMessage('Preferences must be an object'),
  
  body('preferences.frequency')
    .optional()
    .isIn(['immediate', 'daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  
  body('preferences.notificationTypes')
    .optional()
    .isObject().withMessage('Notification types must be an object'),
  
  body('preferences.notificationTypes.newBlog')
    .optional()
    .isBoolean().withMessage('newBlog must be a boolean'),
  
  body('preferences.notificationTypes.blogUpdates')
    .optional()
    .isBoolean().withMessage('blogUpdates must be a boolean'),
  
  body('preferences.notificationTypes.newsletters')
    .optional()
    .isBoolean().withMessage('newsletters must be a boolean'),
  
  body('preferences.notificationTypes.comments')
    .optional()
    .isBoolean().withMessage('comments must be a boolean')
];

/**
 * Update subscriber preferences validation
 */
const updateSubscriberPreferencesValidator = [
  param('token')
    .notEmpty().withMessage('Token is required')
    .isString().withMessage('Token must be a string'),
  
  body('preferences')
    .notEmpty().withMessage('Preferences are required')
    .isObject().withMessage('Preferences must be an object'),
  
  body('preferences.frequency')
    .optional()
    .isIn(['immediate', 'daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  
  body('preferences.notificationTypes')
    .optional()
    .isObject().withMessage('Notification types must be an object'),
  
  body('preferences.notificationTypes.newBlog')
    .optional()
    .isBoolean().withMessage('newBlog must be a boolean'),
  
  body('preferences.notificationTypes.blogUpdates')
    .optional()
    .isBoolean().withMessage('blogUpdates must be a boolean'),
  
  body('preferences.notificationTypes.newsletters')
    .optional()
    .isBoolean().withMessage('newsletters must be a boolean'),
  
  body('preferences.notificationTypes.comments')
    .optional()
    .isBoolean().withMessage('comments must be a boolean'),
  
  body('preferences.categories')
    .optional()
    .isArray().withMessage('Categories must be an array'),
  
  body('preferences.categories.*')
    .optional()
    .isMongoId().withMessage('Invalid category ID')
];

/**
 * Unsubscribe validation
 */
const unsubscribeValidator = [
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('ip')
    .optional()
    .isString().withMessage('IP must be a string'),
  
  body('reason')
    .optional()
    .isIn(['spam', 'too_many_emails', 'not_interested', 'other']).withMessage('Invalid reason')
];

/**
 * Subscriber query validators
 */
const subscriberQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'unsubscribed', 'bounced', 'spam']).withMessage('Invalid status'),
  
  query('search')
    .optional()
    .isString().withMessage('Search term must be a string')
    .trim()
    .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
  
  query('isVerified')
    .optional()
    .isBoolean().withMessage('isVerified must be a boolean'),
  
  query('sort')
    .optional()
    .isIn(['-createdAt', 'createdAt', '-subscriptionDate', 'subscriptionDate', '-emailOpenCount', 'emailOpenCount'])
    .withMessage('Invalid sort parameter')
];

/**
 * Subscriber ID validation
 */
const subscriberIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid subscriber ID')
];

/**
 * Bulk subscriber action validation
 */
const bulkSubscriberActionValidator = [
  body('subscriberIds')
    .isArray().withMessage('Subscriber IDs must be an array')
    .notEmpty().withMessage('Subscriber IDs are required'),
  
  body('subscriberIds.*')
    .isMongoId().withMessage('Invalid subscriber ID'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'delete', 'send_email']).withMessage('Invalid action'),
  
  body('emailData')
    .optional()
    .isObject().withMessage('Email data must be an object')
];

/**
 * Email notification validation
 */
const emailNotificationValidator = [
  body('subject')
    .notEmpty().withMessage('Email subject is required')
    .isString().withMessage('Subject must be a string')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters'),
  
  body('content')
    .notEmpty().withMessage('Email content is required')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  
  body('recipients')
    .optional()
    .isArray().withMessage('Recipients must be an array'),
  
  body('recipients.*')
    .optional()
    .isEmail().withMessage('Invalid recipient email'),
  
  body('sendToAll')
    .optional()
    .isBoolean().withMessage('sendToAll must be a boolean')
];

module.exports = {
  createSubscriberValidator,
  updateSubscriberPreferencesValidator,
  unsubscribeValidator,
  subscriberQueryValidator,
  subscriberIdValidator,
  bulkSubscriberActionValidator,
  emailNotificationValidator
};