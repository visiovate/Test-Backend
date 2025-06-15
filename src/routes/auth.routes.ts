import express from 'express';
import { registerUser, registerMaid, login, refreshToken, getProfile, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerUserSchema,
  registerMaidSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema
} from '../validations/auth.validation';

const router = express.Router();

// Auth routes
router.post('/register/user', validate(registerUserSchema), registerUser);
router.post('/register/maid', validate(registerMaidSchema), registerMaid);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Protected routes
router.get('/profile', authenticate('jwt'), getProfile);
router.patch('/profile', authenticate('jwt'), validate(updateProfileSchema), updateProfile);

export default router; 