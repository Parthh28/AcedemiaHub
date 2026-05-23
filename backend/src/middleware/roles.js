// src/middleware/roles.js — Role-based access control
const { forbidden } = require('../utils/response');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Not authenticated');
    // Admin can access everything
    if (req.user.role === 'admin') return next();
    // Check if user's role matches any of the required roles
    const hasRole = roles.some(role => {
      if (role === 'seller') return ['seller', 'both'].includes(req.user.role);
      if (role === 'buyer') return ['buyer', 'both'].includes(req.user.role);
      return req.user.role === role;
    });
    if (!hasRole) return forbidden(res, `Requires role: ${roles.join(' or ')}`);
    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return forbidden(res, 'Admin access required');
  }
  next();
}

function requireOwnerOrAdmin(paramField = 'userId') {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Not authenticated');
    if (req.user.role === 'admin') return next();
    if (req.user.id === req.params[paramField]) return next();
    return forbidden(res, 'Access denied: not the owner');
  };
}

module.exports = { requireRole, requireAdmin, requireOwnerOrAdmin };
