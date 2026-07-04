// src/middleware/roles.js — Role-based access control
const { forbidden } = require('../utils/response');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Not authenticated');
    // For the hackathon, all users have access to all dashboards
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
