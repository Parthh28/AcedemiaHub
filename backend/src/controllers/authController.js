// src/controllers/authController.js
const authService = require('../services/authService');
const { success, created, error, badRequest } = require('../utils/response');
const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['buyer', 'seller', 'both']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    return created(res, result, 'Account created successfully');
  } catch (err) {
    if (err.name === 'ZodError') return badRequest(res, 'Validation failed', err.errors);
    if (err.code === 'EMAIL_EXISTS') return error(res, err.message, 409, err.code);
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    return success(res, result, 'Login successful');
  } catch (err) {
    if (err.name === 'ZodError') return badRequest(res, 'Validation failed', err.errors);
    if (err.code === 'INVALID_CREDENTIALS') return error(res, err.message, 401, err.code);
    if (err.code === 'SUSPENDED') return error(res, err.message, 403, err.code);
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token required');
    const result = await authService.refreshTokens(refreshToken);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    if (err.status === 401) return error(res, err.message, 401, 'INVALID_REFRESH_TOKEN');
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    return success(res, {}, 'Logged out successfully');
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, { user });
  } catch (err) { next(err); }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().nullable().optional(),
  upiId: z.string().nullable().optional(),
  collegeId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  year: z.number().int().min(1).max(6).nullable().optional(),
  bio: z.string().nullable().optional()
});

async function getColleges(req, res, next) {
  try {
    const list = await authService.getColleges();
    return success(res, { colleges: list });
  } catch (err) { next(err); }
}

async function getDepartments(req, res, next) {
  try {
    const { college_id } = req.query;
    const list = await authService.getDepartments(college_id);
    return success(res, { departments: list });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await authService.updateProfile(req.user.id, data);
    return success(res, { user: updated }, 'Profile updated successfully');
  } catch (err) {
    if (err.name === 'ZodError') return badRequest(res, 'Validation failed', err.errors);
    next(err);
  }
}

async function updateAvatar(req, res, next) {
  try {
    if (!req.file) {
      return badRequest(res, 'No avatar file uploaded');
    }
    const result = await authService.updateAvatar(req.user.id, req.file);
    return success(res, { profile_pic_url: result.profile_pic_url }, 'Avatar updated successfully');
  } catch (err) { next(err); }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  getColleges,
  getDepartments,
  updateProfile,
  updateAvatar
};

