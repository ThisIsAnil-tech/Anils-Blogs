/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
const truncate = (str, length = 100, suffix = '...') => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeWords = (str) => {
  if (!str || str.length === 0) return str;
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} CamelCase string
 */
const toCamelCase = (str) => {
  if (!str || str.length === 0) return str;
  
  return str
    .replace(/([-_\s]+.)/g, (match) => match.charAt(match.length - 1).toUpperCase())
    .replace(/[-_\s]/g, '')
    .replace(/^./, (match) => match.toLowerCase());
};

/**
 * Convert string to PascalCase
 * @param {string} str - String to convert
 * @returns {string} PascalCase string
 */
const toPascalCase = (str) => {
  if (!str || str.length === 0) return str;
  
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/**
 * Convert string to snake_case
 * @param {string} str - String to convert
 * @returns {string} snake_case string
 */
const toSnakeCase = (str) => {
  if (!str || str.length === 0) return str;
  
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
};

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-case string
 */
const toKebabCase = (str) => {
  if (!str || str.length === 0) return str;
  
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/^-/, '');
};

/**
 * Extract domain from URL
 * @param {string} url - URL
 * @returns {string} Domain name
 */
const extractDomain = (url) => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract keywords from text
 * @param {string} text - Text to extract keywords from
 * @param {number} count - Number of keywords
 * @param {Array<string>} stopWords - Words to exclude
 * @returns {Array<string>} Keywords
 */
const extractKeywords = (text, count = 10, stopWords = ['the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'by', 'with', 'without']) => {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
  
  const wordCount = {};
  words.forEach(word => {
    if (!stopWords.includes(word) && word.length > 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @param {string} chars - Characters to use (default: alphanumeric)
 * @returns {string} Random string
 */
const generateRandomString = (length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  const charsLength = chars.length;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
};

/**
 * Remove HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Count words in string
 * @param {string} str - String to count
 * @returns {number} Word count
 */
const countWords = (str) => {
  if (!str) return 0;
  return str.trim().split(/\s+/).length;
};

/**
 * Truncate HTML string
 * @param {string} html - HTML string
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} Truncated HTML
 */
const truncateHtml = (html, length = 100, suffix = '...') => {
  if (!html) return '';
  const text = stripHtml(html);
  return truncate(text, length, suffix);
};

/**
 * Get reading time
 * @param {string} text - Text to read
 * @param {number} wordsPerMinute - Words per minute (default: 200)
 * @returns {number} Reading time in minutes
 */
const getReadingTime = (text, wordsPerMinute = 200) => {
  if (!text) return 0;
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

/**
 * Highlight text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @param {string} highlightClass - CSS class for highlight
 * @returns {string} Highlighted text
 */
const highlightText = (text, query, highlightClass = 'highlight') => {
  if (!text || !query) return text;
  
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return text.replace(regex, (match) => `<span class="${highlightClass}">${match}</span>`);
};

module.exports = {
  truncate,
  capitalize,
  capitalizeWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  extractDomain,
  isValidEmail,
  isValidUrl,
  extractKeywords,
  generateRandomString,
  stripHtml,
  countWords,
  truncateHtml,
  getReadingTime,
  highlightText
};