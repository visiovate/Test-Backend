import Stripe from 'stripe';
import { config } from '../config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
} 