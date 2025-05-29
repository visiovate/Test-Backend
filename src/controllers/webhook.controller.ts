import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

const webhookService = new WebhookService();

export class WebhookController {
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'No signature provided' });
    }

    try {
      const result = await webhookService.handleStripeWebhook(signature, req.body);
      res.json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }
} 