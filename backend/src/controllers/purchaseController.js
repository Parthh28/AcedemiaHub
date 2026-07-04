// src/controllers/purchaseController.js
const paymentService = require('../services/paymentService');
const supabase = require('../config/supabase');
const { success, created, error, notFound, badRequest, forbidden } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { v4: uuidv4 } = require('uuid');

// ─── CART ─────────────────────────────────────────────────────────────────────
async function getCart(req, res, next) {
  try {
    const { data, error: err } = await supabase
      .from('cart_items')
      .select(`id, added_at, notes:notes_id(id, title, price, is_free, preview_url, rating, seller:users!seller_id(first_name, last_name))`)
      .eq('user_id', req.user.id);

    if (err) throw err;
    const total = (data || []).reduce((sum, item) => sum + (item.notes?.price || 0), 0);
    return success(res, { items: data, total });
  } catch (err) { next(err); }
}

async function addToCart(req, res, next) {
  try {
    const { notesId } = req.body;
    if (!notesId) return badRequest(res, 'notesId is required');

    // Check note exists and is live
    const { data: note } = await supabase.from('notes').select('id, status, seller_id').eq('id', notesId).single();
    if (!note || note.status !== 'live') return notFound(res, 'Note not available');
    if (note.seller_id === req.user.id) return badRequest(res, 'Cannot add your own note to cart');

    // Check already purchased
    const { data: purchase } = await supabase.from('purchases').select('id').eq('buyer_id', req.user.id).eq('notes_id', notesId).single();
    if (purchase) return badRequest(res, 'Already purchased');

    const { error: err } = await supabase.from('cart_items').insert({ id: uuidv4(), user_id: req.user.id, notes_id: notesId });
    if (err?.code === '23505') return badRequest(res, 'Already in cart');
    if (err) throw err;

    return created(res, {}, 'Added to cart');
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const { error: err } = await supabase.from('cart_items').delete().eq('id', req.params.itemId).eq('user_id', req.user.id);
    if (err) throw err;
    return success(res, {}, 'Removed from cart');
  } catch (err) { next(err); }
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
async function initiatePayment(req, res, next) {
  try {
    const { notesId } = req.body;
    if (!notesId) return badRequest(res, 'notesId is required');

    const { data: note } = await supabase
      .from('notes')
      .select('id, price, is_free, status, seller:users!seller_id(id, razorpay_account_id)')
      .eq('id', notesId)
      .single();
      
    if (!note || note.status !== 'live') return notFound(res, 'Note not available');
    if (note.is_free) return badRequest(res, 'This note is free. Use direct purchase endpoint.');

    const PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;
    const sellerId = note.seller.id;
    const razorpayAccountId = note.seller.razorpay_account_id || `acc_mock_${sellerId.substring(0,8)}`;
    
    const grossAmount = note.price;
    const commission = grossAmount * PLATFORM_COMMISSION;
    const netAmount = grossAmount - commission;
    const netAmountPaisa = Math.round(netAmount * 100);

    const transfers = [{
        account: razorpayAccountId,
        amount: netAmountPaisa,
        currency: 'INR',
        notes: { seller_id: sellerId },
        on_hold: 0
    }];

    const result = await paymentService.initiatePayment({ userId: req.user.id, notesId, amount: note.price, transfers });
    return success(res, result, 'Payment initiated');
  } catch (err) { next(err); }
}

async function verifyPayment(req, res, next) {
  try {
    const { notesId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;
    if (!notesId || !razorpayOrderId) return badRequest(res, 'notesId and razorpayOrderId are required');

    const result = await paymentService.verifyAndCompletePurchase({
      userId: req.user.id,
      notesId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod
    });

    // Remove from cart if present
    await supabase.from('cart_items').delete().eq('user_id', req.user.id).eq('notes_id', notesId);

    return success(res, result, 'Purchase completed');
  } catch (err) {
    if (err.status) {
      return error(res, err.message, err.status, err.status === 409 ? 'DUPLICATE_PURCHASE' : 'PAYMENT_ERROR');
    }
    next(err);
  }
}

async function initiateCartPayment(req, res, next) {
  try {
    // Fetch cart total and seller details
    const { data: cartItems, error: cartErr } = await supabase
      .from('cart_items')
      .select('notes:notes_id(price, status, is_free, seller:users!seller_id(id, razorpay_account_id))')
      .eq('user_id', req.user.id);

    if (cartErr || !cartItems || cartItems.length === 0) return badRequest(res, 'Cart is empty');

    let totalAmount = 0;
    const transfers = [];
    const PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;

    for (const item of cartItems) {
      if (item.notes.status !== 'live') return badRequest(res, 'One or more items in your cart are no longer available.');
      if (!item.notes.is_free) {
        totalAmount += item.notes.price;
        
        const sellerId = item.notes.seller.id;
        const razorpayAccountId = item.notes.seller.razorpay_account_id || `acc_mock_${sellerId.substring(0,8)}`;
        
        const grossAmount = item.notes.price;
        const commission = grossAmount * PLATFORM_COMMISSION;
        const netAmount = grossAmount - commission;
        const netAmountPaisa = Math.round(netAmount * 100);

        const existingTransfer = transfers.find(t => t.account === razorpayAccountId);
        if (existingTransfer) {
            existingTransfer.amount += netAmountPaisa;
        } else {
            transfers.push({
                account: razorpayAccountId,
                amount: netAmountPaisa,
                currency: 'INR',
                notes: { seller_id: sellerId },
                on_hold: 0
            });
        }
      }
    }

    if (totalAmount === 0) {
      return badRequest(res, 'All items in cart are free. Use free purchase endpoint instead.');
    }

    const result = await paymentService.initiateCartPayment({ userId: req.user.id, amount: totalAmount, transfers });
    return success(res, result, 'Cart payment initiated');
  } catch (err) { next(err); }
}

async function verifyCartPayment(req, res, next) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return badRequest(res, 'Payment details are missing');
    }

    const result = await paymentService.verifyAndCompleteCartPurchase({
      userId: req.user.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    return success(res, result, 'Cart purchase completed successfully');
  } catch (err) {
    if (err.status) {
      return error(res, err.message, err.status, 'PAYMENT_ERROR');
    }
    next(err);
  }
}

async function purchaseFree(req, res, next) {
  try {
    const { notesId } = req.body;
    const { data: note } = await supabase.from('notes').select('id, is_free, status').eq('id', notesId).single();
    if (!note || note.status !== 'live') return notFound(res, 'Note not available');
    if (!note.is_free) return badRequest(res, 'This note is not free');

    const purchaseId = uuidv4();
    const { error: err } = await supabase.from('purchases').insert({
      id: purchaseId, buyer_id: req.user.id, notes_id: notesId,
      amount_paid: 0, payment_method: 'free', status: 'completed'
    });
    if (err?.code === '23505') return error(res, 'Already acquired', 409);
    if (err) throw err;

    return success(res, { purchase_id: purchaseId, download_url: `/api/v1/notes/downloads/file/${notesId}` }, 'Note acquired');
  } catch (err) { next(err); }
}

async function purchaseWithCredits(req, res, next) {
  try {
    return error(res, 'Credit system is currently on hold.', 403, 'FEATURE_DISABLED');
  } catch (err) {
    next(err);
  }
}


// ─── PURCHASES ────────────────────────────────────────────────────────────────
async function getPurchases(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { data, error: err, count } = await supabase
      .from('purchases')
      .select(`id, amount_paid, status, purchased_at, notes:notes_id(id, title, price, preview_url, subject, colleges(name), seller:users!seller_id(first_name, last_name))`, { count: 'exact' })
      .eq('buyer_id', req.user.id)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (err) throw err;
    return success(res, { purchases: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function requestRefund(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await paymentService.processRefund({ userId: req.user.id, purchaseId: req.params.purchaseId, reason });
    return success(res, result, 'Refund processed');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
async function getWishlist(req, res, next) {
  try {
    const { data, error: err } = await supabase
      .from('wishlists')
      .select(`id, created_at, notes:notes_id(id, title, price, is_free, preview_url, rating, seller:users!seller_id(first_name, last_name))`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return success(res, { wishlist: data });
  } catch (err) { next(err); }
}

async function addToWishlist(req, res, next) {
  try {
    const { notesId } = req.body;
    if (!notesId) return badRequest(res, 'notesId is required');
    const { error: err } = await supabase.from('wishlists').insert({ id: uuidv4(), user_id: req.user.id, notes_id: notesId });
    if (err?.code === '23505') return badRequest(res, 'Already in wishlist');
    if (err) throw err;
    return created(res, {}, 'Added to wishlist');
  } catch (err) { next(err); }
}

async function removeFromWishlist(req, res, next) {
  try {
    const { notesId } = req.body;
    const { error: err } = await supabase.from('wishlists').delete().eq('user_id', req.user.id).eq('notes_id', notesId);
    if (err) throw err;
    return success(res, {}, 'Removed from wishlist');
  } catch (err) { next(err); }
}

module.exports = { getCart, addToCart, removeFromCart, initiatePayment, verifyPayment, initiateCartPayment, verifyCartPayment, purchaseFree, purchaseWithCredits, getPurchases, requestRefund, getWishlist, addToWishlist, removeFromWishlist };
