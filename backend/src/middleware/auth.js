// src/middleware/auth.js — JWT authentication middleware
const { verifyAccessToken } = require('../config/jwt');
const { unauthorized } = require('../utils/response');
const supabase = require('../config/supabase');

async function authenticate(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    const decoded = verifyAccessToken(token);

    // Load fresh user from Supabase to check status
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return unauthorized(res, 'User not found');
    if (user.status === 'suspended') return unauthorized(res, 'Account suspended');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token');
    return unauthorized(res, 'Authentication failed');
  }
}

// Optional auth — attaches user if token present, continues otherwise
async function optionalAuth(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) return next();

    const decoded = verifyAccessToken(token);

    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name')
      .eq('id', decoded.id)
      .single();

    if (user && user.status === 'active') req.user = user;
    next();
  } catch {
    next();
  }
}

module.exports = { authenticate, optionalAuth };
