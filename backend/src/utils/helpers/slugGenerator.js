const slugify = require('slugify');

/**
 * Generate a slug from a string
 * @param {string} text - Text to slugify
 * @param {Object} options - Slugify options
 * @returns {string} Generated slug
 */
const generateSlug = (text, options = {}) => {
  const defaultOptions = {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return slugify(text, mergedOptions);
};

/**
 * Generate unique slug for model
 * @param {Object} model - Mongoose model
 * @param {string} title - Title to slugify
 * @param {string} field - Slug field name (default: 'slug')
 * @returns {Promise<string>} Unique slug
 */
const generateUniqueSlug = async (model, title, field = 'slug') => {
  let slug = generateSlug(title);
  let uniqueSlug = slug;
  let counter = 1;

  // Check if slug exists
  while (true) {
    const existing = await model.findOne({ [field]: uniqueSlug });
    if (!existing) break;
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

/**
 * Generate slug with random suffix
 * @param {string} text - Text to slugify
 * @param {number} length - Length of random suffix
 * @returns {string} Slug with random suffix
 */
const generateRandomSlug = (text, length = 6) => {
  const slug = generateSlug(text);
  const random = Math.random().toString(36).substring(2, 2 + length);
  return `${slug}-${random}`;
};

/**
 * Generate SEO-friendly slug
 * @param {string} text - Text to slugify
 * @param {Object} options - Additional options
 * @returns {string} SEO-friendly slug
 */
const generateSeoSlug = (text, options = {}) => {
  const seoOptions = {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
    replacement: '-',
    ...options
  };

  return generateSlug(text, seoOptions);
};

/**
 * Generate slug for blog
 * @param {string} title - Blog title
 * @param {string} id - Blog ID
 * @returns {string} Blog slug
 */
const generateBlogSlug = (title, id) => {
  const slug = generateSlug(title);
  return `${slug}-${id}`;
};

/**
 * Clean slug
 * @param {string} slug - Slug to clean
 * @returns {string} Cleaned slug
 */
const cleanSlug = (slug) => {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} Is valid slug
 */
const isValidSlug = (slug) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

/**
 * Extract title from slug
 * @param {string} slug - Slug
 * @returns {string} Title
 */
const slugToTitle = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate path from slug
 * @param {string} slug - Slug
 * @param {string} prefix - Path prefix
 * @returns {string} Full path
 */
const generatePath = (slug, prefix = '') => {
  const cleanedSlug = cleanSlug(slug);
  return prefix ? `/${prefix}/${cleanedSlug}` : `/${cleanedSlug}`;
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  generateRandomSlug,
  generateSeoSlug,
  generateBlogSlug,
  cleanSlug,
  isValidSlug,
  slugToTitle,
  generatePath
};