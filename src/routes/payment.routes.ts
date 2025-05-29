import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Create a payment intent
router.post('/create-intent', authenticate('jwt'), paymentController.createPaymentIntent);

// Confirm a payment
router.get('/confirm/:paymentIntentId', authenticate('jwt'), paymentController.confirmPayment);

// Process a refund
router.post('/refund/:paymentIntentId', authenticate('jwt'), paymentController.refundPayment);

export default router; 