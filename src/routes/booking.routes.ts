import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as bookingController from '../controllers/booking.controller';
import {
  createBookingSchema,
  getBookingDetailsSchema,
  cancelBookingSchema,
  getChatMessagesSchema,
  sendChatMessageSchema,
  getBookingHistorySchema
} from '../validations/booking.validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create booking
router.post(
  '/',
  validate(createBookingSchema),
  bookingController.createBooking
);

// Get booking details
router.get(
  '/:id',
  validate(getBookingDetailsSchema),
  bookingController.getBookingDetails
);

// Cancel booking
router.post(
  '/:id/cancel',
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

// Get chat messages
router.get(
  '/:id/messages',
  validate(getChatMessagesSchema),
  bookingController.getChatMessages
);

// Send chat message
router.post(
  '/:id/messages',
  validate(sendChatMessageSchema),
  bookingController.sendChatMessage
);

// Get booking history
router.get(
  '/history',
  validate(getBookingHistorySchema),
  bookingController.getBookingHistory
);

export default router; 