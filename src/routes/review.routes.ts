import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as reviewController from '../controllers/review.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get maid reviews
router.get(
  '/maid/:maidId',
  [
    param('maidId').isUUID(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  reviewController.getMaidReviews
);

// Get user reviews
router.get(
  '/user',
  [
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  reviewController.getUserReviews
);

// Create review
router.post(
  '/booking/:bookingId',
  [
    param('bookingId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
  ],
  validate,
  reviewController.createReview
);

// Update review
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().notEmpty(),
  ],
  validate,
  reviewController.updateReview
);

// Delete review
router.delete(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  reviewController.deleteReview
);

export default router; 