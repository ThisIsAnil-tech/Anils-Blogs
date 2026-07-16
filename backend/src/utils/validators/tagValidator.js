const { body, param, query } = require('express-validator');

/**
 * Create tag validation rules
 */
const createTagValidator = [
  body('name')
    .notEmpty().withMessage('Tag name is required')
    .isString().withMessage('Tag name must be a string')
    .trim()
    .isLength({ min: 2, max: 30 }).withMessage('Tag name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/).withMessage('Tag name can only contain letters, numbers, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  body('color')
    .optional()
    .isString().withMessage('Color must be a string')
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex color code'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('metaTitle')
    .optional()
    .isString().withMessage('Meta title must be a string')
    .trim()
    .isLength({ max: 60 }).withMessage('Meta title cannot exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .isString().withMessage('Meta description must be a string')
    .trim()
    .isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters')
];

/**
 * Update tag validation rules
 */
const updateTagValidator = [
  param('id')
    .isMongoId().withMessage('Invalid tag ID'),
  
  body('name')
    .optional()
    .isString().withMessage('Tag name must be a string')
    .trim()
    .isLength({ min: 2, max: 30 }).withMessage('Tag name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/).withMessage('Tag name can only contain letters, numbers, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  body('color')
    .optional()
    .isString().withMessage('Color must be a string')
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex color code'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('metaTitle')
    .optional()
    .isString().withMessage('Meta title must be a string')
    .trim()
    .isLength({ max: 60 }).withMessage('Meta title cannot exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .isString().withMessage('Meta description must be a string')
    .trim()
    .isLength({ max: 160 }).withMessage('Meta description cannot exceed 160 characters')
];

/**
 * Tag ID validation
 */
const tagIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid tag ID')
];

/**
 * Tag slug validation
 */
const tagSlugValidator = [
  param('slug')
    .notEmpty().withMessage('Tag slug is required')
    .isString().withMessage('Tag slug must be a string')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid slug format')
];

/**
 * Tag query validators
 */
const tagQueryValidator = [
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
    .isIn(['name', '-name', '-createdAt', 'createdAt', '-blogCount', 'blogCount'])
    .withMessage('Invalid sort parameter'),
  
  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  query('search')
    .optional()
    .isString().withMessage('Search term must be a string')
    .trim()
    .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters')
];

/**
 * Bulk tag action validation
 */
const bulkTagActionValidator = [
  body('tagIds')
    .isArray().withMessage('Tag IDs must be an array')
    .notEmpty().withMessage('Tag IDs are required'),
  
  body('tagIds.*')
    .isMongoId().withMessage('Invalid tag ID'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'delete']).withMessage('Invalid action')
];

module.exports = {
  createTagValidator,
  updateTagValidator,
  tagIdValidator,
  tagSlugValidator,
  tagQueryValidator,
  bulkTagActionValidator
};