// src/routes/admin.js
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.use(authenticate, requireAdmin);

router.get('/dashboard', ctrl.getDashboard);
router.get('/moderation-queue', ctrl.getModerationQueue);
router.post('/notes/:notesId/approve', ctrl.approveNote);
router.post('/notes/:notesId/reject', ctrl.rejectNote);
router.get('/users', ctrl.listUsers);
router.post('/users/:userId/suspend', ctrl.suspendUser);
router.post('/users/:userId/unsuspend', ctrl.unsuspendUser);
router.get('/payouts', ctrl.getAdminPayouts);
router.post('/payouts/:id/process', ctrl.processPayout);
router.post('/college/add', ctrl.addCollege);
router.get('/sales', ctrl.getAllSales);

module.exports = router;
