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
    ...(data && { data }),
    ...(errors && { errors })
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
  sendPaginated
};