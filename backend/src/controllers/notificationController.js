// src/controllers/notificationController.js
const supabase = require('../config/supabase');
const { success } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');

async function getNotifications(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return success(res, { notifications: data }, 'OK', 200, paginationMeta(page, limit, count));
  } catch (err) { next(err); }
}

async function getUnreadCount(req, res, next) {
  try {
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('read', false);
    return success(res, { unread_count: count || 0 });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    return success(res, {}, 'Marked as read');
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id).eq('read', false);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) { next(err); }
}

async function deleteNotification(req, res, next) {
  try {
    await supabase.from('notifications').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    return success(res, {}, 'Notification deleted');
  } catch (err) { next(err); }
}

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
