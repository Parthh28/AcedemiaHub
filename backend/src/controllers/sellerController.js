// src/controllers/sellerController.js
const supabase = require('../config/supabase');
const analyticsService = require('../services/analyticsService');
const { success, created, badRequest, notFound } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { v4: uuidv4 } = require('uuid');

async function getDashboard(req, res, next) {
  try {
    const stats = await analyticsService.getSellerDashboard(req.user.id);
    return success(res, { dashboard: stats });
  } catch (err) { next(err); }
}

async function getMyNotes(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { data, error, count } = await supabase
      .from('notes')
      .select(`id, title, subject, year, price, is_free, status, rating, rating_count, download_count, preview_url, rejection_reason, created_at, published_at, departments(name), colleges(name)`, { count: 'exact' })
      .eq('seller_id', req.user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return success(res, { notes: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function getAnalytics(req, res, next) {
  try {
    const { days = 30 } = req.query;
    const chart = await analyticsService.getSellerSalesChart(req.user.id, parseInt(days));
    return success(res, { chart, period_days: parseInt(days) });
  } catch (err) { next(err); }
}

async function getEarnings(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { data, error, count } = await supabase
      .from('seller_earnings')
      .select(`id, gross_amount, platform_commission, net_amount, status, created_at, notes:notes_id(id, title)`, { count: 'exact' })
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return success(res, { earnings: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function getPayouts(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', req.user.id)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    return success(res, { payouts: data });
  } catch (err) { next(err); }
}

async function requestPayout(req, res, next) {
  try {
    const { amount, upiId } = req.body;
    if (!amount || amount < 100) return badRequest(res, 'Minimum payout amount is ₹100');
    if (!upiId) return badRequest(res, 'UPI ID is required');

    // Check available balance
    const { data: earnings } = await supabase
      .from('seller_earnings')
      .select('net_amount')
      .eq('seller_id', req.user.id)
      .eq('status', 'available');

    const available = (earnings || []).reduce((sum, e) => sum + e.net_amount, 0);
    if (amount > available) return badRequest(res, `Insufficient balance. Available: ₹${available.toFixed(2)}`);

    const { data: payout, error } = await supabase
      .from('payouts')
      .insert({ id: uuidv4(), seller_id: req.user.id, amount, upi_id: upiId, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return created(res, { payout }, 'Payout request submitted');
  } catch (err) { next(err); }
}

async function getSalesSummary(req, res, next) {
  try {
    const { data: sales, error } = await supabase
      .from('seller_earnings')
      .select(`id, gross_amount, net_amount, created_at, notes:notes_id(id, title), purchase:purchase_id(buyer_id)`)
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return success(res, { sales });
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getMyNotes, getAnalytics, getEarnings, getPayouts, requestPayout, getSalesSummary };
