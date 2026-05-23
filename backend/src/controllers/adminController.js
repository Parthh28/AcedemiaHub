// src/controllers/adminController.js
const supabase = require('../config/supabase');
const analyticsService = require('../services/analyticsService');
const { success, notFound, badRequest } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { v4: uuidv4 } = require('uuid');

async function getDashboard(req, res, next) {
  try {
    const [analytics, pendingCount, payoutCount] = await Promise.all([
      analyticsService.getAdminAnalytics(),
      supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return success(res, {
      ...analytics,
      pending_moderation: pendingCount.count || 0,
      pending_payouts: payoutCount.count || 0
    });
  } catch (err) { next(err); }
}

async function getModerationQueue(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { data, error, count } = await supabase
      .from('moderation_queue')
      .select(`id, status, submitted_at, reviewed_at, reviewer_comments, notes:notes_id(id, title, description, subject, seller:users!seller_id(first_name, last_name, email))`, { count: 'exact' })
      .eq('status', req.query.status || 'pending')
      .order('submitted_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return success(res, { queue: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function approveNote(req, res, next) {
  try {
    const { notesId } = req.params;
    const { comments } = req.body;

    await supabase.from('notes').update({ status: 'live', published_at: new Date().toISOString(), reviewed_by_admin_id: req.user.id, review_date: new Date().toISOString() }).eq('id', notesId);
    await supabase.from('moderation_queue').update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewer_comments: comments, assigned_to_admin: req.user.id }).eq('notes_id', notesId).eq('status', 'pending');

    // Notify seller
    const { data: note } = await supabase.from('notes').select('seller_id, title').eq('id', notesId).single();
    if (note) {
      await supabase.from('notifications').insert({
        id: uuidv4(), user_id: note.seller_id, type: 'admin_alert',
        title: 'Note Approved ✅',
        message: `Your note "${note.title}" has been approved and is now live!`,
        related_id: notesId
      });
    }

    return success(res, {}, 'Note approved and is now live');
  } catch (err) { next(err); }
}

async function rejectNote(req, res, next) {
  try {
    const { notesId } = req.params;
    const { reason, comments } = req.body;
    if (!reason) return badRequest(res, 'Rejection reason is required');

    await supabase.from('notes').update({ status: 'rejected', rejection_reason: reason, reviewed_by_admin_id: req.user.id, review_date: new Date().toISOString() }).eq('id', notesId);
    await supabase.from('moderation_queue').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reason_for_rejection: reason, reviewer_comments: comments, assigned_to_admin: req.user.id }).eq('notes_id', notesId).eq('status', 'pending');

    const { data: note } = await supabase.from('notes').select('seller_id, title').eq('id', notesId).single();
    if (note) {
      await supabase.from('notifications').insert({
        id: uuidv4(), user_id: note.seller_id, type: 'admin_alert',
        title: 'Note Rejected ❌',
        message: `Your note "${note.title}" was rejected. Reason: ${reason}`,
        related_id: notesId
      });
    }

    return success(res, {}, 'Note rejected');
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    let query = supabase.from('users').select('id, email, first_name, last_name, role, status, email_verified, created_at, last_login', { count: 'exact' });
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.role) query = query.eq('role', req.query.role);
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    return success(res, { users: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function suspendUser(req, res, next) {
  try {
    const { reason } = req.body;
    await supabase.from('users').update({ status: 'suspended' }).eq('id', req.params.userId);
    await supabase.from('notifications').insert({ id: uuidv4(), user_id: req.params.userId, type: 'admin_alert', title: 'Account Suspended', message: reason || 'Your account has been suspended.' });
    return success(res, {}, 'User suspended');
  } catch (err) { next(err); }
}

async function unsuspendUser(req, res, next) {
  try {
    await supabase.from('users').update({ status: 'active' }).eq('id', req.params.userId);
    return success(res, {}, 'User reactivated');
  } catch (err) { next(err); }
}

async function getAdminPayouts(req, res, next) {
  try {
    const { data, error } = await supabase.from('payouts').select(`*, seller:seller_id(id, first_name, last_name, email)`).eq('status', 'pending').order('requested_at', { ascending: true });
    if (error) throw error;
    return success(res, { payouts: data });
  } catch (err) { next(err); }
}

async function processPayout(req, res, next) {
  try {
    const { transactionId } = req.body;
    const { data: payout } = await supabase.from('payouts').select('*').eq('id', req.params.id).single();
    if (!payout) return notFound(res, 'Payout not found');

    await supabase.from('payouts').update({ status: 'completed', completed_at: new Date().toISOString(), transaction_id: transactionId }).eq('id', req.params.id);

    // Mark associated earnings as paid
    await supabase.from('seller_earnings').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('seller_id', payout.seller_id).eq('status', 'available');

    await supabase.from('notifications').insert({ id: uuidv4(), user_id: payout.seller_id, type: 'payout', title: 'Payout Processed 💸', message: `₹${payout.amount.toFixed(2)} has been sent to your UPI (${payout.upi_id}).`, related_id: payout.id });

    return success(res, {}, 'Payout processed');
  } catch (err) { next(err); }
}

async function addCollege(req, res, next) {
  try {
    const { name, city, state, country, websiteUrl, studentCount } = req.body;
    if (!name) return badRequest(res, 'College name is required');
    const { data, error } = await supabase.from('colleges').insert({ id: uuidv4(), name, city, state, country: country || 'India', website_url: websiteUrl, student_count: studentCount }).select().single();
    if (error) throw error;
    return success(res, { college: data }, 'College added');
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getModerationQueue, approveNote, rejectNote, listUsers, suspendUser, unsuspendUser, getAdminPayouts, processPayout, addCollege };
