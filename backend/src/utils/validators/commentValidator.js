const { body, param, query } = require('express-validator');

/**
 * Create comment validation rules
 */
const createCommentValidator = [
  body('content')
    .notEmpty().withMessage('Comment content is required')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Comment must be between 1 and 5000 characters'),
  
  body('authorName')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('authorEmail')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('authorWebsite')
    .optional()
    .isURL().withMessage('Please provide a valid URL')
    .trim(),
  
  body('parentComment')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID')
];

/**
 * Update comment validation rules
 */
const updateCommentValidator = [
  param('id')
    .isMongoId().withMessage('Invalid comment ID'),
  
  body('content')
    .notEmpty().withMessage('Comment content is required')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Comment must be between 1 and 5000 characters')
];

/**
 * Comment query validators
 */
const commentQueryValidator = [
  param('blogId')
    .isMongoId().withMessage('Invalid blog ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  query('sort')
    .optional()
    .isIn(['-createdAt', 'createdAt', '-likes', 'likes'])
    .withMessage('Invalid sort parameter')
];

/**
 * Comment ID validation
 */
const commentIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid comment ID')
];

/**
 * Comment moderation validation
 */
const commentModerationValidator = [
  param('id')
    .isMongoId().withMessage('Invalid comment ID'),
  
  body('reason')
    .optional()
    .isString().withMessage('Reason must be a string')
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

/**
 * Comment reply validation
 */
const commentReplyValidator = [
  param('id')
    .isMongoId().withMessage('Invalid comment ID'),
  
  body('content')
    .notEmpty().withMessage('Reply content is required')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Reply must be between 1 and 5000 characters'),
  
  body('authorName')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('authorEmail')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Comment bulk action validation
 */
const commentBulkActionValidator = [
  body('commentIds')
    .isArray().withMessage('Comment IDs must be an array')
    .notEmpty().withMessage('Comment IDs are required'),
  
  body('commentIds.*')
    .isMongoId().withMessage('Invalid comment ID'),
  
  body('action')
    .isIn(['approve', 'reject', 'delete', 'spam']).withMessage('Invalid action')
];

module.exports = {
  createCommentValidator,
  updateCommentValidator,
  commentQueryValidator,
  commentIdValidator,
  commentModerationValidator,
  commentReplyValidator,
  commentBulkActionValidator
};