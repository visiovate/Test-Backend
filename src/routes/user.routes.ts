import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  getSavedMaids,
  saveMaid,
  removeSavedMaid,
  getBookings,
  getBookingDetails,
  cancelBooking,
  getReviews,
  leaveReview,
} from '../controllers/user.controller';

const router = Router();

// Apply authentication middleware
router.use(authenticate('jwt'));

// Saved maids
router.get('/saved-maids', getSavedMaids);
router.post(
  '/saved-maids/:maidId',
  saveMaid
);
router.delete(
  '/saved-maids/:maidId',
  removeSavedMaid
);

// Bookings
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingDetails);
router.post(
  '/bookings/:id/cancel',
  [
    body('reason').optional().isString(),
  ],
  validate,
  cancelBooking
);

// Reviews
router.get('/reviews', getReviews);
router.post(
  '/bookings/:id/review',
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString(),
  ],
  validate,
  leaveReview
);

export default router; 