// src/routes/reviews.js
const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const createReviewSchema = z.object({
  notesId: z.string().uuid({ message: 'notesId must be a valid UUID' }),
  rating: z.coerce.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  reviewText: z.string().optional()
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  reviewText: z.string().optional()
});

router.get('/notes/:notesId', optionalAuth, ctrl.getNoteReviews);
router.post('/', authenticate, validate(createReviewSchema), ctrl.createReview);
router.put('/:reviewId', authenticate, validate(updateReviewSchema), ctrl.updateReview);
router.delete('/:reviewId', authenticate, ctrl.deleteReview);
router.post('/:reviewId/helpful', authenticate, ctrl.markHelpful);

module.exports = router;
