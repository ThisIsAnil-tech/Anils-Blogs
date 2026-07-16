/**
 * Format date to string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const replacements = {
    'YYYY': year,
    'MM': month,
    'DD': day,
    'HH': hours,
    'mm': minutes,
    'ss': seconds
  };

  let result = format;
  Object.keys(replacements).forEach(key => {
    result = result.replace(key, replacements[key]);
  });

  return result;
};

/**
 * Get relative time from date
 * @param {Date|string} date - Date to compare
 * @param {Date|string} baseDate - Base date (default: now)
 * @returns {string} Relative time string
 */
const getRelativeTime = (date, baseDate = new Date()) => {
  const d = new Date(date);
  const base = new Date(baseDate);
  
  if (isNaN(d.getTime())) return 'Invalid date';

  const diff = base.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 10) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Get time ago in exact format
 * @param {Date|string} date - Date to compare
 * @returns {string} Time ago string
 */
const getTimeAgo = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return formatDate(d, 'MMM DD, YYYY');
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} Is today
 */
const isToday = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} Is past
 */
const isPast = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
};

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} Is future
 */
const isFuture = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
};

/**
 * Get date range
 * @param {number} days - Number of days
 * @param {Date|string} baseDate - Base date (default: now)
 * @returns {Object} Date range
 */
const getDateRange = (days, baseDate = new Date()) => {
  const base = new Date(baseDate);
  if (isNaN(base.getTime())) return null;

  const end = new Date(base);
  const start = new Date(base);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of day
 * @param {Date|string} date - Date
 * @returns {Object} Day boundaries
 */
const getDayBoundaries = (date = new Date()) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of week
 * @param {Date|string} date - Date
 * @param {number} weekStart - Week start day (0=Sunday, 1=Monday)
 * @returns {Object} Week boundaries
 */
const getWeekBoundaries = (date = new Date(), weekStart = 1) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const day = d.getDay();
  const diff = (day >= weekStart) ? day - weekStart : 7 - weekStart + day;

  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of month
 * @param {Date|string} date - Date
 * @returns {Object} Month boundaries
 */
const getMonthBoundaries = (date = new Date()) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of year
 * @param {Date|string} date - Date
 * @returns {Object} Year boundaries
 */
const getYearBoundaries = (date = new Date()) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const start = new Date(d.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(d.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted date
 */
const formatDisplayDate = (date, locale = 'en-US') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date time for display
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted date time
 */
const formatDisplayDateTime = (date, locale = 'en-US') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string
 * @returns {Date|null} Date object or null
 */
const parseDate = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

module.exports = {
  formatDate,
  getRelativeTime,
  getTimeAgo,
  isToday,
  isPast,
  isFuture,
  getDateRange,
  getDayBoundaries,
  getWeekBoundaries,
  getMonthBoundaries,
  getYearBoundaries,
  formatDisplayDate,
  formatDisplayDateTime,
  parseDate
};