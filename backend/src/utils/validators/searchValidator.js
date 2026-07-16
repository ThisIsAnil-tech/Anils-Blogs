const { body, query } = require('express-validator');

/**
 * Search query validators
 */
const searchQueryValidator = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  
  query('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .trim(),
  
  query('tag')
    .optional()
    .isString().withMessage('Tag must be a string')
    .trim(),
  
  query('sort')
    .optional()
    .isIn(['relevance', 'date', 'views', 'likes', 'comments']).withMessage('Invalid sort option'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  query('dateFrom')
    .optional()
    .isISO8601().withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601().withMessage('Date to must be a valid date')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('Date to must be after date from');
      }
      return true;
    }),
  
  query('status')
    .optional()
    .isIn(['published', 'draft', 'scheduled', 'archived']).withMessage('Invalid status')
];

/**
 * Advanced search validation
 */
const advancedSearchValidator = [
  body('query')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  
  body('filters')
    .optional()
    .isObject().withMessage('Filters must be an object'),
  
  body('filters.categories')
    .optional()
    .isArray().withMessage('Categories must be an array'),
  
  body('filters.categories.*')
    .optional()
    .isString().withMessage('Category must be a string'),
  
  body('filters.tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('filters.tags.*')
    .optional()
    .isString().withMessage('Tag must be a string'),
  
  body('filters.dateRange')
    .optional()
    .isObject().withMessage('Date range must be an object'),
  
  body('filters.dateRange.from')
    .optional()
    .isISO8601().withMessage('Date from must be a valid date'),
  
  body('filters.dateRange.to')
    .optional()
    .isISO8601().withMessage('Date to must be a valid date'),
  
  body('filters.status')
    .optional()
    .isIn(['published', 'draft', 'scheduled', 'archived']).withMessage('Invalid status'),
  
  body('filters.isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean'),
  
  body('sort')
    .optional()
    .isObject().withMessage('Sort must be an object'),
  
  body('sort.field')
    .optional()
    .isIn(['relevance', 'title', 'publishDate', 'viewCount', 'likeCount', 'commentCount'])
    .withMessage('Invalid sort field'),
  
  body('sort.order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  
  body('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt()
];

/**
 * Search suggestions validation
 */
const searchSuggestionsValidator = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Search query must be between 1 and 50 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
    .toInt(),
  
  query('type')
    .optional()
    .isIn(['all', 'blogs', 'categories', 'tags']).withMessage('Invalid type')
];

/**
 * Search analytics validation
 */
const searchAnalyticsValidator = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year']).withMessage('Invalid period'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt()
];

module.exports = {
  searchQueryValidator,
  advancedSearchValidator,
  searchSuggestionsValidator,
  searchAnalyticsValidator
};