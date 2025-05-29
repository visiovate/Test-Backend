import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const paymentIntent = await paymentService.createPaymentIntent(amount, currency);
      res.json(paymentIntent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.params;
      const paymentIntent = await paymentService.confirmPayment(paymentIntentId);
      res.json(paymentIntent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async refundPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.params;
      const { amount } = req.body;

      const refund = await paymentService.refundPayment(paymentIntentId, amount);
      res.json(refund);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
} 