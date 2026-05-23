// src/controllers/reviewController.js
const supabase = require('../config/supabase');
const { success, created, error, notFound, forbidden, badRequest } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

async function createReview(req, res, next) {
  try {
    const { notesId, rating, reviewText } = req.body;

    // Verify purchase
    const { data: purchase } = await supabase.from('purchases').select('id').eq('buyer_id', req.user.id).eq('notes_id', notesId).eq('status', 'completed').single();
    if (!purchase) return forbidden(res, 'You must purchase this note to review it');

    const { data: review, error: err } = await supabase
      .from('reviews')
      .insert({ id: uuidv4(), notes_id: notesId, reviewer_id: req.user.id, rating: parseInt(rating), review_text: reviewText })
      .select(`id, rating, review_text, helpful_count, created_at, reviewer:users!reviewer_id(id, first_name, last_name, profile_pic_url)`)
      .single();

    if (err?.code === '23505') return error(res, 'Already reviewed this note', 409);
    if (err) throw err;

    // Recalculate note rating
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('notes_id', notesId);
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await supabase.from('notes').update({ rating: parseFloat(avgRating.toFixed(2)), rating_count: allReviews.length }).eq('id', notesId);

    // Notify note seller
    const { data: note } = await supabase.from('notes').select('seller_id, title').eq('id', notesId).single();
    if (note) {
      await supabase.from('notifications').insert({
        id: uuidv4(), user_id: note.seller_id, type: 'review',
        title: 'New Review Received ⭐',
        message: `"${note.title}" received a ${rating}-star review.`,
        related_id: review.id
      });
    }

    return created(res, { review }, 'Review submitted');
  } catch (err) { next(err); }
}

async function getNoteReviews(req, res, next) {
  try {
    const { data, error: err } = await supabase
      .from('reviews')
      .select(`id, rating, review_text, helpful_count, created_at, reviewer:users!reviewer_id(id, first_name, last_name, profile_pic_url)`)
      .eq('notes_id', req.params.notesId)
      .order('helpful_count', { ascending: false });
    if (err) throw err;
    return success(res, { reviews: data });
  } catch (err) { next(err); }
}

async function updateReview(req, res, next) {
  try {
    const { rating, reviewText } = req.body;
    const { data: existing } = await supabase.from('reviews').select('reviewer_id').eq('id', req.params.reviewId).single();
    if (!existing) return notFound(res, 'Review not found');
    if (existing.reviewer_id !== req.user.id) return forbidden(res, 'Not your review');

    const { data, error: err } = await supabase
      .from('reviews')
      .update({ rating: parseInt(rating), review_text: reviewText, updated_at: new Date().toISOString() })
      .eq('id', req.params.reviewId)
      .select()
      .single();
    if (err) throw err;
    return success(res, { review: data }, 'Review updated');
  } catch (err) { next(err); }
}

async function deleteReview(req, res, next) {
  try {
    const { data: existing } = await supabase.from('reviews').select('reviewer_id').eq('id', req.params.reviewId).single();
    if (!existing) return notFound(res, 'Review not found');
    if (existing.reviewer_id !== req.user.id && req.user.role !== 'admin') return forbidden(res, 'Not authorized');
    await supabase.from('reviews').delete().eq('id', req.params.reviewId);
    return success(res, {}, 'Review deleted');
  } catch (err) { next(err); }
}

async function markHelpful(req, res, next) {
  try {
    try {
      const { error: rpcErr } = await supabase.rpc('increment_helpful', { review_id: req.params.reviewId });
      if (rpcErr) throw rpcErr;
    } catch (e) {
      // ignore
    }
    return success(res, {}, 'Marked as helpful');
  } catch (err) { next(err); }
}

module.exports = { createReview, getNoteReviews, updateReview, deleteReview, markHelpful };
