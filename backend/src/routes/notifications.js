// src/routes/notifications.js
const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.post('/:id/mark-read', ctrl.markRead);
router.post('/mark-all-read', ctrl.markAllRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
