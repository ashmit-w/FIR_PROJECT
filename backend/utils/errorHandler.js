// Centralized error handling utilities
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation helpers
const validateRequired = (data, fields) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
};

const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, 400);
  }
};

const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new AppError('Start date cannot be after end date', 400);
  }
};

// Database helpers
const checkUnique = async (Model, field, value, excludeId = null) => {
  const query = { [field]: value };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existing = await Model.findOne(query);
  if (existing) {
    throw new AppError(`${field} already exists`, 400);
  }
};

const findByIdOrFail = async (Model, id, errorMessage = 'Resource not found') => {
  const doc = await Model.findById(id);
  if (!doc) {
    throw new AppError(errorMessage, 404);
  }
  return doc;
};

// Response helpers
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = 'Error', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

// Pagination helper
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    query: query.skip(skip).limit(limit),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      skip
    }
  };
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  validateRequired,
  validateEnum,
  validateDateRange,
  checkUnique,
  findByIdOrFail,
  sendSuccess,
  sendError,
  paginate
};
