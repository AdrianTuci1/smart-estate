// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.error = 'Validation Error';
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.error = 'Invalid Token';
    error.message = 'Invalid authentication token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.error = 'Token Expired';
    error.message = 'Authentication token has expired';
    return res.status(401).json(error);
  }

  // AWS DynamoDB errors
  if (err.code === 'ConditionalCheckFailedException') {
    error.error = 'Resource Conflict';
    error.message = 'Resource already exists or condition not met';
    return res.status(409).json(error);
  }

  if (err.code === 'ResourceNotFoundException') {
    error.error = 'Resource Not Found';
    error.message = 'The requested resource was not found';
    return res.status(404).json(error);
  }

  // Rate limiting error
  if (err.status === 429) {
    error.error = 'Too Many Requests';
    error.message = 'Rate limit exceeded, please try again later';
    return res.status(429).json(error);
  }

  // Custom application errors
  if (err.statusCode) {
    error.error = err.error || 'Application Error';
    error.message = err.message;
    return res.status(err.statusCode).json(error);
  }

  // Default to 500 server error
  res.status(500).json(error);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = {
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  };
  res.status(404).json(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
