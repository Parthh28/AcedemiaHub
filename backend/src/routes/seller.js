// src/routes/seller.js
const router = require('express').Router();
const ctrl = require('../controllers/sellerController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(authenticate, requireRole('seller'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/notes', ctrl.getMyNotes);
router.get('/analytics', ctrl.getAnalytics);
router.get('/sales-chart', ctrl.getAnalytics);
router.get('/earnings', ctrl.getEarnings);
router.get('/payouts', ctrl.getPayouts);
router.post('/request-payout', ctrl.requestPayout);
router.post('/connect-bank', ctrl.connectBankAccount);
router.get('/sales', ctrl.getSalesSummary);

module.exports = router;
