const { body, param, query } = require('express-validator');

/**
 * Media upload validation
 */
const mediaUploadValidator = [
  body('folder')
    .optional()
    .isString().withMessage('Folder must be a string')
    .trim(),
  
  body('publicId')
    .optional()
    .isString().withMessage('Public ID must be a string')
    .trim(),
  
  body('alt')
    .optional()
    .isString().withMessage('Alt text must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('Alt text cannot exceed 100 characters'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString().withMessage('Tag must be a string')
    .trim(),
  
  body('width')
    .optional()
    .isInt({ min: 1 }).withMessage('Width must be a positive integer')
    .toInt(),
  
  body('height')
    .optional()
    .isInt({ min: 1 }).withMessage('Height must be a positive integer')
    .toInt(),
  
  body('crop')
    .optional()
    .isIn(['fill', 'fit', 'limit', 'pad', 'scale']).withMessage('Invalid crop option'),
  
  body('quality')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Quality must be between 1 and 100')
    .toInt()
];

/**
 * Media delete validation
 */
const mediaDeleteValidator = [
  param('publicId')
    .notEmpty().withMessage('Public ID is required')
    .isString().withMessage('Public ID must be a string'),
  
  query('resourceType')
    .optional()
    .isIn(['image', 'video', 'raw']).withMessage('Resource type must be image, video, or raw')
];

/**
 * Media query validators
 */
const mediaQueryValidator = [
  query('type')
    .optional()
    .isIn(['image', 'video', 'all']).withMessage('Type must be image, video, or all'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('search')
    .optional()
    .isString().withMessage('Search term must be a string')
    .trim()
    .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
  
  query('sort')
    .optional()
    .isIn(['-createdAt', 'createdAt', '-size', 'size', '-width', 'width'])
    .withMessage('Invalid sort parameter')
];

/**
 * Media batch delete validation
 */
const mediaBatchDeleteValidator = [
  body('publicIds')
    .isArray().withMessage('Public IDs must be an array')
    .notEmpty().withMessage('Public IDs are required'),
  
  body('publicIds.*')
    .isString().withMessage('Public ID must be a string')
    .notEmpty().withMessage('Public ID cannot be empty'),
  
  body('resourceType')
    .optional()
    .isIn(['image', 'video', 'raw']).withMessage('Resource type must be image, video, or raw')
];

/**
 * Media transform validation
 */
const mediaTransformValidator = [
  body('publicId')
    .notEmpty().withMessage('Public ID is required')
    .isString().withMessage('Public ID must be a string'),
  
  body('transformations')
    .notEmpty().withMessage('Transformations are required')
    .isObject().withMessage('Transformations must be an object'),
  
  body('transformations.width')
    .optional()
    .isInt({ min: 1 }).withMessage('Width must be a positive integer')
    .toInt(),
  
  body('transformations.height')
    .optional()
    .isInt({ min: 1 }).withMessage('Height must be a positive integer')
    .toInt(),
  
  body('transformations.crop')
    .optional()
    .isIn(['fill', 'fit', 'limit', 'pad', 'scale']).withMessage('Invalid crop option'),
  
  body('transformations.quality')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Quality must be between 1 and 100')
    .toInt(),
  
  body('transformations.format')
    .optional()
    .isIn(['jpg', 'png', 'gif', 'webp', 'svg']).withMessage('Invalid format'),
  
  body('transformations.effect')
    .optional()
    .isString().withMessage('Effect must be a string'),
  
  body('transformations.gravity')
    .optional()
    .isIn(['auto', 'center', 'north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'])
    .withMessage('Invalid gravity option'),
  
  body('transformations.opacity')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Opacity must be between 0 and 100')
    .toInt(),
  
  body('transformations.angle')
    .optional()
    .isInt().withMessage('Angle must be a number')
    .toInt()
];

module.exports = {
  mediaUploadValidator,
  mediaDeleteValidator,
  mediaQueryValidator,
  mediaBatchDeleteValidator,
  mediaTransformValidator
};