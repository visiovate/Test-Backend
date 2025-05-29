import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import * as maidController from '../controllers/maid.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get maid profile
router.get('/profile', maidController.getProfile);

// Update maid profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim().isMobilePhone('any'),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('zipCode').optional().trim(),
    body('hourlyRate').optional().isFloat({ min: 0 }),
    body('services').optional().isArray(),
    body('services.*').optional().isString(),
    body('availability').optional().isArray(),
    body('availability.*.day').optional().isIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    body('availability.*.startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('availability.*.endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  validate,
  maidController.updateProfile
);

// Upload profile image
router.post(
  '/profile/image',
  upload.single('image'),
  maidController.uploadProfileImage
);

// Get bookings
router.get(
  '/bookings',
  [
    body('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  maidController.getBookings
);

// Get booking details
router.get(
  '/bookings/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  maidController.getBookingDetails
);

// Update booking status
router.patch(
  '/bookings/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['ACCEPTED', 'REJECTED', 'COMPLETED']),
    body('notes').optional().trim(),
  ],
  validate,
  maidController.updateBookingStatus
);

// Get reviews
router.get(
  '/reviews',
  [
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  maidController.getReviews
);

// Get earnings
router.get(
  '/earnings',
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  maidController.getEarnings
);

// Update availability
router.put(
  '/availability',
  [
    body('availability').isArray(),
    body('availability.*.day').isIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    body('availability.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('availability.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  validate,
  maidController.updateAvailability
);

export default router; 