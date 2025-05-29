import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import maidRoutes from './maid.routes';
import bookingRoutes from './booking.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import searchRoutes from './search.routes';
import { globalRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply global rate limiter
router.use(globalRateLimiter);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/maids', maidRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/search', searchRoutes);

// Webhook routes (no rate limiting for webhooks)
router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export const setupRoutes = () => router; 