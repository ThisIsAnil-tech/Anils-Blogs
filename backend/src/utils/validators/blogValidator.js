const { body, param, query } = require('express-validator');

/**
 * Create blog validation rules
 */
const createBlogValidator = [
  body('title')
    .notEmpty().withMessage('Blog title is required')
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('excerpt')
    .notEmpty().withMessage('Blog excerpt is required')
    .isString().withMessage('Excerpt must be a string')
    .trim()
    .isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters'),
  
  body('content')
    .notEmpty().withMessage('Blog content is required')
    .isString().withMessage('Content must be a string')
    .isLength({ min: 200 }).withMessage('Content must be at least 200 characters'),
  
  body('featuredImage')
    .notEmpty().withMessage('Featured image is required')
    .isURL().withMessage('Featured image must be a valid URL'),
  
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),
  
  body('images.*.url')
    .optional()
    .isURL().withMessage('Image URL must be valid'),
  
  body('images.*.alt')
    .optional()
    .isString().withMessage('Image alt text must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('Image alt text cannot exceed 100 characters'),
  
  body('videos')
    .optional()
    .isArray().withMessage('Videos must be an array'),
  
  body('videos.*.url')
    .optional()
    .isURL().withMessage('Video URL must be valid'),
  
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
  
  body('publishDate')
    .optional()
    .isISO8601().withMessage('Publish date must be a valid date'),
  
  body('scheduleDate')
    .optional()
    .isISO8601().withMessage('Schedule date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.status === 'scheduled' && !value) {
        throw new Error('Schedule date is required for scheduled status');
      }
      return true;
    }),
  
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean'),
  
  body('isSticky')
    .optional()
    .isBoolean().withMessage('isSticky must be a boolean'),
  
  body('seoSettings')
    .optional()
    .isObject().withMessage('SEO settings must be an object'),
  
  body('seoSettings.title')
    .optional()
    .isString().withMessage('SEO title must be a string')
    .trim()
    .isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters'),
  
  body('seoSettings.description')
    .optional()
    .isString().withMessage('SEO description must be a string')
    .trim()
    .isLength({ max: 160 }).withMessage('SEO description cannot exceed 160 characters'),
  
  body('seoSettings.keywords')
    .optional()
    .isArray().withMessage('SEO keywords must be an array'),
  
  body('seoSettings.keywords.*')
    .optional()
    .isString().withMessage('SEO keyword must be a string')
    .trim(),
  
  body('seoSettings.noIndex')
    .optional()
    .isBoolean().withMessage('noIndex must be a boolean'),
  
  body('seoSettings.noFollow')
    .optional()
    .isBoolean().withMessage('noFollow must be a boolean'),
  
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
  
  body('settings.allowComments')
    .optional()
    .isBoolean().withMessage('allowComments must be a boolean'),
  
  body('settings.showInHomePage')
    .optional()
    .isBoolean().withMessage('showInHomePage must be a boolean'),
  
  body('settings.showInArchive')
    .optional()
    .isBoolean().withMessage('showInArchive must be a boolean')
];

/**
 * Update blog validation rules
 */
const updateBlogValidator = [
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
  
  body('featuredImage')
    .optional()
    .isURL().withMessage('Featured image must be a valid URL'),
  
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),
  
  body('videos')
    .optional()
    .isArray().withMessage('Videos must be an array'),
  
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived']).withMessage('Invalid status'),
  
  body('publishDate')
    .optional()
    .isISO8601().withMessage('Publish date must be a valid date'),
  
  body('scheduleDate')
    .optional()
    .isISO8601().withMessage('Schedule date must be a valid date'),
  
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean'),
  
  body('isSticky')
    .optional()
    .isBoolean().withMessage('isSticky must be a boolean'),
  
  body('seoSettings')
    .optional()
    .isObject().withMessage('SEO settings must be an object'),
  
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object')
];

/**
 * Blog query validators
 */
const blogQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sort')
    .optional()
    .isIn(['-publishDate', 'publishDate', '-viewCount', 'viewCount', '-likeCount', 'likeCount', '-createdAt', 'createdAt'])
    .withMessage('Invalid sort parameter'),
  
  query('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .trim(),
  
  query('tag')
    .optional()
    .isString().withMessage('Tag must be a string')
    .trim(),
  
  query('search')
    .optional()
    .isString().withMessage('Search term must be a string')
    .trim()
    .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters')
];

/**
 * Blog ID validation
 */
const blogIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid blog ID')
];

/**
 * Blog slug validation
 */
const blogSlugValidator = [
  param('slug')
    .notEmpty().withMessage('Blog slug is required')
    .isString().withMessage('Blog slug must be a string')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid slug format')
];

/**
 * Notification validation
 */
const notificationValidator = [
  body('blogId')
    .isMongoId().withMessage('Invalid blog ID'),
  
  body('subject')
    .optional()
    .isString().withMessage('Subject must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  
  body('message')
    .optional()
    .isString().withMessage('Message must be a string')
    .trim()
];

module.exports = {
  createBlogValidator,
  updateBlogValidator,
  blogQueryValidator,
  blogIdValidator,
  blogSlugValidator,
  notificationValidator
};