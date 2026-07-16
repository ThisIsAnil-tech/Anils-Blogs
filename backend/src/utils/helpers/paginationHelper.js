/**
 * Get pagination parameters
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} maxLimit - Maximum items per page
 * @returns {Object} Pagination parameters
 */
const getPagination = (page = 1, limit = 12, maxLimit = 100) => {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(parseInt(limit) || 12, maxLimit);
  
  const skip = (parsedPage - 1) * parsedLimit;
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
    take: parsedLimit
  };
};

/**
 * Create pagination metadata
 * @param {number} total - Total items count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMetadata = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Get pagination links
 * @param {string} baseUrl - Base URL
 * @param {number} page - Current page
 * @param {number} totalPages - Total pages
 * @param {Object} query - Additional query parameters
 * @returns {Object} Pagination links
 */
const getPaginationLinks = (baseUrl, page, totalPages, query = {}) => {
  const links = {
    first: null,
    last: null,
    prev: null,
    next: null
  };

  if (totalPages > 0) {
    links.first = `${baseUrl}?page=1`;
    links.last = `${baseUrl}?page=${totalPages}`;
    
    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}`;
    }
    
    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}`;
    }
  }

  // Add query parameters
  Object.keys(query).forEach(key => {
    if (query[key]) {
      links.first += `&${key}=${query[key]}`;
      links.last += `&${key}=${query[key]}`;
      if (links.prev) links.prev += `&${key}=${query[key]}`;
      if (links.next) links.next += `&${key}=${query[key]}`;
    }
  });

  return links;
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated parameters
 */
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(
    Math.max(1, parseInt(limit) || 12),
    100
  );
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Get pagination range
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Range of items
 */
const getPaginationRange = (total, page, limit) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(start + limit - 1, total);
  
  return {
    start,
    end,
    total
  };
};

/**
 * Get cursor-based pagination
 * @param {string} cursor - Cursor string
 * @param {number} limit - Items per page
 * @param {string} sortField - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} Cursor parameters
 */
const getCursorPagination = (cursor, limit = 12, sortField = '_id', sortOrder = 'desc') => {
  const parsedLimit = Math.min(parseInt(limit) || 12, 100);
  const order = sortOrder === 'asc' ? 1 : -1;
  
  let query = {};
  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString('ascii');
    const [lastId, lastValue] = decoded.split('|');
    query = {
      [sortField]: order === 1 ? { $gt: lastValue } : { $lt: lastValue }
    };
    if (sortField !== '_id') {
      query._id = { $ne: lastId };
    }
  }
  
  return {
    query,
    limit: parsedLimit,
    sort: { [sortField]: order, _id: order }
  };
};

/**
 * Generate next cursor
 * @param {Array} items - Current items
 * @param {string} sortField - Sort field
 * @returns {string|null} Next cursor
 */
const getNextCursor = (items, sortField = '_id') => {
  if (!items || items.length === 0) return null;
  
  const lastItem = items[items.length - 1];
  const cursor = `${lastItem._id}|${lastItem[sortField]}`;
  return Buffer.from(cursor).toString('base64');
};

/**
 * Get pagination for mobile
 * @param {boolean} isMobile - Is mobile device
 * @param {number} desktopLimit - Desktop limit
 * @param {number} mobileLimit - Mobile limit
 * @returns {number} Appropriate limit
 */
const getMobilePaginationLimit = (isMobile, desktopLimit = 12, mobileLimit = 4) => {
  return isMobile ? mobileLimit : desktopLimit;
};

module.exports = {
  getPagination,
  getPaginationMetadata,
  getPaginationLinks,
  validatePagination,
  getPaginationRange,
  getCursorPagination,
  getNextCursor,
  getMobilePaginationLimit
};