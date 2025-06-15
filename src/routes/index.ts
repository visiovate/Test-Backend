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
import testRoutes from './test.routes';
import serviceRoutes from './service.routes';
import { globalRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply global rate limiter
router.use(globalRateLimiter);

// API routes with their prefixes
router.use('/auth', authRoutes);        // Authentication routes
router.use('/users', userRoutes);       // User management routes
router.use('/maids', maidRoutes);       // Maid service routes
router.use('/bookings', bookingRoutes); // Booking management routes
router.use('/reviews', reviewRoutes);   // Review management routes
router.use('/notifications', notificationRoutes); // Notification routes
router.use('/payments', paymentRoutes); // Payment processing routes
router.use('/search', searchRoutes);    // Search functionality routes
router.use('/test', testRoutes);        // Test routes
router.use('/', serviceRoutes);         // Service routes

// Webhook routes (no rate limiting for webhooks)
router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Export the router setup function
export const setupRoutes = () => router; 