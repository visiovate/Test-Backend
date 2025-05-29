import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { commonValidations } from '../middleware/validation.middleware';
import {
  registerUser,
  registerMaid,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';

const router = Router();

// Apply rate limiter to auth routes
router.use(authRateLimiter);

// User registration
router.post(
  '/register/user',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').isLength({ min: 2 }),
    body('lastName').isLength({ min: 2 }),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/),
  ],
  validate,
  registerUser
);

// Maid registration
router.post(
  '/register/maid',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').isLength({ min: 2 }),
    body('lastName').isLength({ min: 2 }),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/),
    body('hourlyRate').isFloat({ min: 0 }),
    body('services').isArray(),
    body('serviceAreas').isArray(),
  ],
  validate,
  registerMaid
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    body('userType').isIn(['user', 'maid']),
  ],
  validate,
  login
);

// Refresh token
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', authenticate('jwt'), logout);

// Get profile
router.get('/profile', authenticate('jwt'), getProfile);

// Update profile
router.put(
  '/profile',
  authenticate('jwt'),
  [
    body('firstName').optional().isLength({ min: 2 }),
    body('lastName').optional().isLength({ min: 2 }),
    body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/),
    body('address').optional().isObject(),
  ],
  validate,
  updateProfile
);

export default router; 