// src/routes/purchases.js
const router = require('express').Router();
const ctrl = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');

// Cart
router.get('/cart', authenticate, ctrl.getCart);
router.post('/cart/add', authenticate, ctrl.addToCart);
router.delete('/cart/:itemId', authenticate, ctrl.removeFromCart);

// Payments
router.post('/payments/initiate', authenticate, ctrl.initiatePayment);
router.post('/payments/verify', authenticate, ctrl.verifyPayment);
router.post('/payments/initiate-cart', authenticate, ctrl.initiateCartPayment);
router.post('/payments/verify-cart', authenticate, ctrl.verifyCartPayment);
router.post('/purchases/free', authenticate, ctrl.purchaseFree);
router.post('/purchases/credits', authenticate, ctrl.purchaseWithCredits);

// Purchase history
router.get('/purchases', authenticate, ctrl.getPurchases);
router.post('/purchases/:purchaseId/refund', authenticate, ctrl.requestRefund);

// Wishlist
router.get('/wishlist', authenticate, ctrl.getWishlist);
router.post('/wishlist/add', authenticate, ctrl.addToWishlist);
router.post('/wishlist/remove', authenticate, ctrl.removeFromWishlist);

module.exports = router;
