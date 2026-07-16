const logger = require('../utils/logger');
const { sendApiResponse } = require('../utils/helpers/apiResponse');

// @desc    Handle 404 errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// @desc    Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  logger.error(`URL: ${req.originalUrl}`);
  logger.error(`Method: ${req.method}`);
  logger.error(`IP: ${req.ip}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.status = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value entered for ${field}`;
    error = new Error(message);
    error.status = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new Error(message);
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new Error(message);
    error.status = 401;
  }

  // MEGA errors
  if (err.message && err.message.includes('MEGA')) {
    error.status = 500;
  }

  // Cloudinary errors
  if (err.message && err.message.includes('Cloudinary')) {
    error.status = 500;
  }

  // Email errors
  if (err.message && err.message.includes('email')) {
    error.status = 500;
  }

  // Rate limiting errors
  if (err.name === 'RateLimitError') {
    error.status = 429;
  }

  // Default error status
  const statusCode = error.status || 500;

  // Send response
  const response = {
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  };

  // Check for validation errors
  if (err.name === 'ValidationError' && err.errors) {
    response.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  res.status(statusCode).json(response);
};

// @desc    Custom error class for API errors
class ApiError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.status = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// @desc    Custom error for validation
class ValidationError extends ApiError {
  constructor(errors) {
    super('Validation Error', 400, errors);
    this.name = 'ValidationError';
  }
}

// @desc    Custom error for not found
class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

// @desc    Custom error for unauthorized
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

// @desc    Custom error for forbidden
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// @desc    Custom error for conflict
class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// @desc    Custom error for rate limit
class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// @desc    Async handler to avoid try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  asyncHandler
};