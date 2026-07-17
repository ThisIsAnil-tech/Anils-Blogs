/**
 * Standard API Response Helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {*} errors - Validation errors
 */
const sendApiResponse = (res, statusCode, success, message, data = null, errors = null) => {
  const response = {
    success,
    message,
    ...(data !== null && data !== undefined && { data }),
    ...(errors !== null && errors !== undefined && { errors }),
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return sendApiResponse(res, statusCode, true, message, data);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Validation errors
 */
const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  return sendApiResponse(res, statusCode, false, message, null, errors);
};

/**
 * Created Response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendApiResponse(res, 201, true, message, data);
};

/**
 * No Content Response
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Bad Request Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 */
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendApiResponse(res, 400, false, message, null, errors);
};

/**
 * Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendApiResponse(res, 401, false, message);
};

/**
 * Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendApiResponse(res, 403, false, message);
};

/**
 * Not Found Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendApiResponse(res, 404, false, message);
};

/**
 * Conflict Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendConflict = (res, message = 'Conflict') => {
  return sendApiResponse(res, 409, false, message);
};

/**
 * Too Many Requests Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendTooManyRequests = (res, message = 'Too many requests') => {
  return sendApiResponse(res, 429, false, message);
};

/**
 * Server Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendServerError = (res, message = 'Internal server error') => {
  return sendApiResponse(res, 500, false, message);
};

/**
 * Paginated Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} pagination - Pagination object
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, pagination, message = 'Data fetched successfully') => {
  return sendApiResponse(res, 200, true, message, {
    items: data,
    pagination
  });
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 * @param {string} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation error') => {
  const formattedErrors = errors.map(err => ({
    field: err.param || err.path || err.field,
    message: err.msg || err.message,
    value: err.value
  }));
  
  return sendApiResponse(res, 400, false, message, null, formattedErrors);
};

/**
 * Bulk Operation Response
 * @param {Object} res - Express response object
 * @param {Object} results - Bulk operation results
 * @param {string} message - Success message
 */
const sendBulkResponse = (res, results, message = 'Bulk operation completed') => {
  return sendApiResponse(res, 200, true, message, {
    total: results.total || 0,
    successful: results.successful || 0,
    failed: results.failed || 0,
    errors: results.errors || [],
    details: results.details || []
  });
};

/**
 * Async Response Wrapper
 * @param {Function} fn - Async function to execute
 * @param {Object} res - Express response object
 * @param {string} successMessage - Success message
 * @param {number} successStatus - Success status code
 */
const asyncResponse = async (fn, res, successMessage = 'Operation successful', successStatus = 200) => {
  try {
    const result = await fn();
    return sendApiResponse(res, successStatus, true, successMessage, result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return sendApiResponse(res, status, false, message);
  }
};

module.exports = {
  sendApiResponse,
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendTooManyRequests,
  sendServerError,
  sendPaginated,
  sendValidationError,
  sendBulkResponse,
  asyncResponse
};