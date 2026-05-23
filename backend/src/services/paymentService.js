// src/services/paymentService.js
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock'
});

/**
 * Helper: Verify Razorpay Signature
 */
function verifySignature(orderId, paymentId, signature) {
  if (process.env.RAZORPAY_KEY_SECRET === 'mock_rzp_secret') return true; // mock bypass
  
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === signature;
}

/**
 * Initiate Cart Payment
 */
async function initiateCartPayment({ userId, amount }) {
  if (amount <= 0) throw Object.assign(new Error('Amount must be greater than 0'), { status: 400 });

  let order;
  try {
    order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // convert to paisa
      currency: 'INR',
      receipt: `rcpt_${uuidv4().substring(0,8)}`
    });
  } catch (err) {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_rzp_key' || process.env.RAZORPAY_KEY_ID === 'mock') {
      order = { id: `order_MOCK_${Date.now()}` }; // Mock fallback for dev
    } else {
      throw err;
    }
  }

  const paymentId = uuidv4();
  const { error } = await supabase.from('payments').insert({
    id: paymentId,
    user_id: userId,
    amount,
    currency: 'INR',
    razorpay_order_id: order.id,
    status: 'pending',
    metadata: JSON.stringify({ type: 'cart' })
  });

  if (error) throw error;

  return {
    payment_id: paymentId,
    razorpay_order_id: order.id,
    amount,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID
  };
}

/**
 * Verify Cart Payment and process all items
 */
async function verifyAndCompleteCartPurchase({ userId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw Object.assign(new Error('Invalid payment signature'), { status: 400 });
  }

  // 1. Fetch Payment Record
  const { data: payment, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .eq('user_id', userId)
    .single();

  if (payError || !payment) throw Object.assign(new Error('Payment not found'), { status: 404 });
  if (payment.status === 'completed') return { status: 'completed' };
  
  // 2. Fetch User Cart Items securely from backend
  const { data: cartItems, error: cartErr } = await supabase
    .from('cart_items')
    .select(`id, notes_id, notes(id, price, is_free, seller_id, title, download_count)`)
    .eq('user_id', userId);
    
  if (cartErr || !cartItems || cartItems.length === 0) {
    throw Object.assign(new Error('Cart is empty or could not be fetched'), { status: 400 });
  }

  // 3. Mark payment completed
  await supabase.from('payments').update({
    razorpay_payment_id: razorpayPaymentId,
    status: 'completed',
    payment_method: 'card',
    updated_at: new Date().toISOString()
  }).eq('id', payment.id);

  // 4. Process each item
  for (const item of cartItems) {
    const note = item.notes;
    const purchaseId = uuidv4();

    const { error: pErr } = await supabase.from('purchases').insert({
      id: purchaseId,
      buyer_id: userId,
      notes_id: note.id,
      amount_paid: note.is_free ? 0 : note.price,
      payment_method: note.is_free ? 'free' : 'card',
      payment_id: payment.id,
      status: 'completed'
    });

    if (pErr && pErr.code === '23505') continue; // Skip if already purchased

    // Earnings & Notifications for seller
    if (!note.is_free && note.seller_id !== userId) {
      const grossAmount = note.price;
      const commission = grossAmount * PLATFORM_COMMISSION;
      const netAmount = grossAmount - commission;

      await supabase.from('seller_earnings').insert({
        id: uuidv4(),
        seller_id: note.seller_id,
        notes_id: note.id,
        purchase_id: purchaseId,
        gross_amount: grossAmount,
        platform_commission: commission,
        net_amount: netAmount,
        status: 'available'
      });

      await supabase.from('notifications').insert({
        id: uuidv4(),
        user_id: note.seller_id,
        type: 'sale',
        title: 'New Sale! 🎉',
        message: `Someone purchased "${note.title}" for ₹${note.price.toFixed(2)}. You earned ₹${netAmount.toFixed(2)}.`,
        related_id: purchaseId
      });
    }

    // Increment download count safely
    try {
      await supabase.rpc('increment_download_count', { note_id: note.id });
    } catch(err) {
      await supabase.from('notes').update({ download_count: (note.download_count || 0) + 1 }).eq('id', note.id);
    }
  }

  // 5. Clear cart
  await supabase.from('cart_items').delete().eq('user_id', userId);

  return { status: 'completed', items_processed: cartItems.length };
}

/**
 * Initiate Payment (Legacy single item checkout)
 */
async function initiatePayment({ userId, notesId, amount }) {
  let order;
  try {
    order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${uuidv4().substring(0,8)}`
    });
  } catch (err) {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_rzp_key' || process.env.RAZORPAY_KEY_ID === 'mock') {
      order = { id: `order_MOCK_${Date.now()}` }; // Mock fallback for dev
    } else {
      throw err;
    }
  }

  const paymentId = uuidv4();
  const { error } = await supabase.from('payments').insert({
    id: paymentId,
    user_id: userId,
    amount,
    currency: 'INR',
    razorpay_order_id: order.id,
    status: 'pending',
    metadata: JSON.stringify({ notes_id: notesId })
  });

  if (error) throw error;

  return {
    payment_id: paymentId,
    razorpay_order_id: order.id,
    amount,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID
  };
}

/**
 * Verify single item purchase (Legacy single item checkout)
 */
async function verifyAndCompletePurchase({ userId, notesId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod = 'card' }) {
  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw Object.assign(new Error('Invalid payment signature'), { status: 400 });
  }

  const { data: payment, error: payError } = await supabase
    .from('payments').select('*').eq('razorpay_order_id', razorpayOrderId).eq('user_id', userId).single();

  if (payError || !payment) throw Object.assign(new Error('Payment not found'), { status: 404 });
  if (payment.status === 'completed') {
    const { data: purchase } = await supabase.from('purchases').select('*').eq('payment_id', payment.id).single();
    if (purchase) return { purchase_id: purchase.id, status: 'completed' };
  }

  const { data: note } = await supabase.from('notes').select('id, seller_id, price, title, is_free, download_count').eq('id', notesId).single();
  if (!note) throw Object.assign(new Error('Note not found'), { status: 404 });

  const purchaseId = uuidv4();
  const amountPaid = note.is_free ? 0 : payment.amount;

  const { data: purchase, error: purchaseError } = await supabase.from('purchases').insert({
    id: purchaseId, buyer_id: userId, notes_id: notesId, amount_paid: amountPaid,
    payment_method: note.is_free ? 'free' : paymentMethod, payment_id: payment.id, status: 'completed'
  }).select().single();

  if (purchaseError) {
    if (purchaseError.code === '23505') throw Object.assign(new Error('Already purchased'), { status: 409 });
    throw purchaseError;
  }

  await supabase.from('payments').update({
    purchase_id: purchaseId, razorpay_payment_id: razorpayPaymentId, status: 'completed', payment_method: paymentMethod, updated_at: new Date().toISOString()
  }).eq('id', payment.id);

  if (!note.is_free && note.seller_id !== userId) {
    const grossAmount = amountPaid;
    const commission = grossAmount * PLATFORM_COMMISSION;
    const netAmount = grossAmount - commission;
    await supabase.from('seller_earnings').insert({
      id: uuidv4(), seller_id: note.seller_id, notes_id: notesId, purchase_id: purchaseId,
      gross_amount: grossAmount, platform_commission: commission, net_amount: netAmount, status: 'available'
    });
  }

  try { await supabase.rpc('increment_download_count', { note_id: notesId }); } 
  catch (err) { await supabase.from('notes').update({ download_count: (note.download_count || 0) + 1 }).eq('id', notesId); }

  return { purchase_id: purchaseId, status: 'completed' };
}

/**
 * Process a refund request
 */
async function processRefund({ userId, purchaseId, reason }) {
  const { data: purchase } = await supabase.from('purchases').select('*, notes(title, seller_id)').eq('id', purchaseId).eq('buyer_id', userId).single();
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  if (purchase.status === 'refunded') throw Object.assign(new Error('Already refunded'), { status: 409 });

  const purchaseDate = new Date(purchase.purchased_at);
  const daysDiff = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7) throw Object.assign(new Error('Refund period (7 days) has expired'), { status: 400 });

  await supabase.from('purchases').update({ status: 'refunded', refunded_at: new Date().toISOString(), refund_amount: purchase.amount_paid, refund_reason: reason }).eq('id', purchaseId);
  await supabase.from('seller_earnings').update({ status: 'pending' }).eq('purchase_id', purchaseId);

  return { refund_amount: purchase.amount_paid, status: 'refunded' };
}

module.exports = { initiatePayment, verifyAndCompletePurchase, initiateCartPayment, verifyAndCompleteCartPurchase, processRefund };
