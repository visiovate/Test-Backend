import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create booking
router.post(
  '/',
  [
    body('maidId').isUUID(),
    body('scheduledDate').isISO8601(),
    body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('duration').isInt({ min: 1 }),
    body('services').isArray(),
    body('services.*').isString(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('zipCode').trim().notEmpty(),
    body('notes').optional().trim(),
  ],
  validate,
  bookingController.createBooking
);

// Get booking details
router.get(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  bookingController.getBookingDetails
);

// Cancel booking
router.post(
  '/:id/cancel',
  [
    param('id').isUUID(),
    body('reason').trim().notEmpty(),
  ],
  validate,
  bookingController.cancelBooking
);

// Get chat messages
router.get(
  '/:id/messages',
  [
    param('id').isUUID(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  bookingController.getChatMessages
);

// Send chat message
router.post(
  '/:id/messages',
  [
    param('id').isUUID(),
    body('message').trim().notEmpty(),
  ],
  validate,
  bookingController.sendChatMessage
);

// Get booking history
router.get(
  '/history',
  [
    body('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  bookingController.getBookingHistory
);

export default router; 