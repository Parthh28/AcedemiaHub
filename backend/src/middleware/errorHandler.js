// src/middleware/errorHandler.js — Global Express error handler
const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Multer file errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'File too large (max 50MB)', 413, 'FILE_TOO_LARGE');
  }
  if (err.message && err.message.startsWith('Invalid file type')) {
    return error(res, err.message, 415, 'INVALID_FILE_TYPE');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Supabase duplicate key / unique constraint
  if (err.code === '23505') {
    return error(res, 'Resource already exists', 409, 'DUPLICATE');
  }

  // Custom status
  if (err.status) {
    return error(res, err.message, err.status, err.code || 'ERROR');
  }

  // Default 500
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return error(res, message, 500, 'SERVER_ERROR');
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
  });
}

module.exports = { errorHandler, notFoundHandler };
