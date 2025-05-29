import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller';

const router = Router();

// Apply authentication middleware
router.use(authenticate('jwt'));

// Get notifications
router.get(
  '/',
  [
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
    body('isRead').optional().isBoolean(),
  ],
  validate,
  getNotifications
);

// Mark notification as read
router.patch(
  '/:id/read',
  markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  deleteNotification
);

// Delete all notifications
router.delete(
  '/',
  deleteAllNotifications
);

export default router; 