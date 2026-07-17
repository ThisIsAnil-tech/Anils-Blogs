const { validationResult, body, param, query } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Validate request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({
    field: err.param || err.path,
    message: err.msg,
    value: err.value
  }));

  logger.warn(`Validation error: ${JSON.stringify(extractedErrors)}`);
  return sendApiResponse(res, 400, false, 'Validation error', null, extractedErrors);
};

// @desc    Validation rules for login
const loginValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isString().withMessage('Username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

// @desc    Validation rules for blog creation
const createBlogValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('excerpt')
    .notEmpty().withMessage('Excerpt is required')
    .isString().withMessage('Excerpt must be a string')
    .trim()
    .isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters'),
  body('content')
    .notEmpty().withMessage('Content is required')
    .isString().withMessage('Content must be a string')
    .isLength({ min: 200 }).withMessage('Content must be at least 200 characters'),
  body('featuredImage')
    .optional()
    .isURL().withMessage('Featured image must be a valid URL'),
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isMongoId().withMessage('Invalid tag ID'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Invalid status'),
  validate
];

// @desc    Validation rules for blog update
const updateBlogValidation = [
  param('id')
    .isMongoId().withMessage('Invalid blog ID'),
  body('title')
    .optional()
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('excerpt')
    .optional()
    .isString().withMessage('Excerpt must be a string')
    .trim()
    .isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters'),
  body('content')
    .optional()
    .isString().withMessage('Content must be a string')
    .isLength({ min: 200 }).withMessage('Content must be at least 200 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Invalid status'),
  validate
];

// @desc    Validation rules for comment
const commentValidation = [
  body('content')
    .notEmpty().withMessage('Comment content is required')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Comment must be between 1 and 5000 characters'),
  body('authorName')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('authorEmail')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('authorWebsite')
    .optional()
    .isURL().withMessage('Please provide a valid URL'),
  body('parentComment')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID'),
  validate
];

// @desc    Validation rules for subscription
const subscribeValidation = [
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
  validate
];

// @desc    Validation rules for password change
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required')
    .isString().withMessage('Password must be a string'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
];

// @desc    Validation rules for ID parameter
const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];

// @desc    Validation rules for pagination
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  validate
];

// @desc    Validation rules for slug parameter
const slugValidation = [
  param('slug')
    .notEmpty().withMessage('Slug is required')
    .isString().withMessage('Slug must be a string')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid slug format'),
  validate
];

// @desc    Validation rules for email
const emailValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate
];

// @desc    Validation rules for notification
const notificationValidation = [
  body('blogId')
    .isMongoId().withMessage('Invalid blog ID'),
  body('subject')
    .optional()
    .isString().withMessage('Subject must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('message')
    .optional()
    .isString().withMessage('Message must be a string'),
  validate
];

// @desc    Validation rules for media upload
const mediaUploadValidation = [
  body('publicId')
    .optional()
    .isString().withMessage('Public ID must be a string'),
  body('resourceType')
    .optional()
    .isIn(['image', 'video']).withMessage('Resource type must be image or video'),
  validate
];

// @desc    Validation rules for profile update
const profileUpdateValidation = [
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
  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),
  body('preferences')
    .optional()
    .isObject().withMessage('Preferences must be an object'),
  validate
];

// @desc    Validation rules for subscriber preferences
const subscriberPreferencesValidation = [
  body('preferences')
    .notEmpty().withMessage('Preferences are required')
    .isObject().withMessage('Preferences must be an object'),
  validate
];

// @desc    Validation rules for category
const categoryValidation = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isString().withMessage('Category name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  validate
];

// @desc    Validation rules for tag
const tagValidation = [
  body('name')
    .notEmpty().withMessage('Tag name is required')
    .isString().withMessage('Tag name must be a string')
    .trim()
    .isLength({ min: 2, max: 30 }).withMessage('Tag name must be between 2 and 30 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  validate
];

// @desc    Validation rules for search
const searchValidation = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .isString().withMessage('Category must be a string'),
  query('tag')
    .optional()
    .isString().withMessage('Tag must be a string'),
  query('sort')
    .optional()
    .isIn(['relevance', 'date', 'views', 'likes']).withMessage('Invalid sort option'),
  validate
];

// @desc    Validation rules for analytics period
const analyticsValidation = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '180d', '365d']).withMessage('Invalid period. Use 7d, 30d, 90d, 180d, or 365d'),
  query('format')
    .optional()
    .isIn(['json', 'csv']).withMessage('Invalid format. Use json or csv'),
  validate
];

// @desc    Validation rules for blog ID parameter
const blogIdValidation = [
  param('blogId')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];

// @desc    Validation rules for Cloudinary publicId parameter
const publicIdValidation = [
  param('publicId')
    .notEmpty().withMessage('Public ID is required')
    .isString().withMessage('Public ID must be a string'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  createBlogValidation,
  updateBlogValidation,
  commentValidation,
  subscribeValidation,
  changePasswordValidation,
  idValidation,
  blogIdValidation,
  publicIdValidation,
  paginationValidation,
  slugValidation,
  emailValidation,
  notificationValidation,
  mediaUploadValidation,
  profileUpdateValidation,
  subscriberPreferencesValidation,
  categoryValidation,
  tagValidation,
  searchValidation,
  analyticsValidation
};