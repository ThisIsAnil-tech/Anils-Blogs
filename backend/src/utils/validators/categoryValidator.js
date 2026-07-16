const { body, param, query } = require('express-validator');

/**
 * Create category validation rules
 */
const createCategoryValidator = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isString().withMessage('Category name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/).withMessage('Category name can only contain letters, numbers, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string')
    .trim()
    .isLength({ max: 50 }).withMessage('Icon cannot exceed 50 characters'),
  
  body('color')
    .optional()
    .isString().withMessage('Color must be a string')
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex color code'),
  
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a positive integer')
    .toInt(),
  
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
 * Update category validation rules
 */
const updateCategoryValidator = [
  param('id')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('name')
    .optional()
    .isString().withMessage('Category name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/).withMessage('Category name can only contain letters, numbers, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string')
    .trim()
    .isLength({ max: 50 }).withMessage('Icon cannot exceed 50 characters'),
  
  body('color')
    .optional()
    .isString().withMessage('Color must be a string')
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex color code'),
  
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a positive integer')
    .toInt(),
  
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
 * Category ID validation
 */
const categoryIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid category ID')
];

/**
 * Category slug validation
 */
const categorySlugValidator = [
  param('slug')
    .notEmpty().withMessage('Category slug is required')
    .isString().withMessage('Category slug must be a string')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid slug format')
];

/**
 * Category query validators
 */
const categoryQueryValidator = [
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
    .isIn(['-order', 'order', 'name', '-name', '-createdAt', 'createdAt'])
    .withMessage('Invalid sort parameter'),
  
  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
  categorySlugValidator,
  categoryQueryValidator
};