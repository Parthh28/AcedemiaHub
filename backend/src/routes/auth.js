// src/routes/auth.js
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts' } } });

router.post('/register', authLimiter, ctrl.register);
router.post('/verify-otp', authLimiter, ctrl.verifyOTP);
router.post('/resend-otp', authLimiter, ctrl.resendOTP);
router.post('/login', authLimiter, ctrl.login);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);

// Phase 2: Helper Endpoints
router.get('/colleges', ctrl.getColleges);
router.get('/departments', ctrl.getDepartments);
router.put('/profile', authenticate, ctrl.updateProfile);
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), ctrl.updateAvatar);

module.exports = router;

