// src/utils/response.js — Standard API response helpers
function success(res, data = {}, message = 'OK', statusCode = 200, pagination = null) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

function created(res, data = {}, message = 'Created') {
  return success(res, data, message, 201);
}

function error(res, message = 'Internal Server Error', statusCode = 500, code = 'SERVER_ERROR') {
  return res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

function badRequest(res, message = 'Bad request', details = null) {
  const body = { success: false, error: { code: 'BAD_REQUEST', message } };
  if (details) body.error.details = details;
  return res.status(400).json(body);
}

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest };
