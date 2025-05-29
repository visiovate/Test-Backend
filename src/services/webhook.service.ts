import { PrismaClient, PaymentStatus, BookingStatus } from '@prisma/client';
import { NotificationService } from './notification.service';
import { config } from '../config';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export class WebhookService {
  async handleStripeWebhook(signature: string, payload: Buffer) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: {
        booking: {
          include: {
            user: true,
            maid: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment not found for payment intent: ${paymentIntent.id}`);
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        status: BookingStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Send notifications
    await Promise.all([
      notificationService.createNotification({
        recipientId: payment.booking.userId,
        recipientType: 'USER',
        type: 'BOOKING_ACCEPTED',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully.',
        data: { bookingId: payment.bookingId },
      }),
      notificationService.createNotification({
        recipientId: payment.booking.maidId,
        recipientType: 'MAID',
        type: 'BOOKING_ACCEPTED',
        title: 'Payment Received',
        message: `Payment received for booking from ${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
        data: { bookingId: payment.bookingId },
      }),
    ]);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment not found for payment intent: ${paymentIntent.id}`);
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        status: BookingStatus.REJECTED,
      },
    });

    // Send notification to user
    await notificationService.createNotification({
      recipientId: payment.booking.userId,
      recipientType: 'USER',
      type: 'BOOKING_REJECTED',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please try again.',
      data: { bookingId: payment.bookingId },
    });
  }

  private async handleRefund(charge: Stripe.Charge) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: charge.payment_intent as string },
      include: {
        booking: {
          include: {
            user: true,
            maid: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment not found for charge: ${charge.id}`);
    }

    const refundAmount = charge.amount_refunded / 100; // Convert from cents

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refunded: true,
        refundAmount,
      },
    });

    // Send notifications
    await Promise.all([
      notificationService.createNotification({
        recipientId: payment.booking.userId,
        recipientType: 'USER',
        type: 'BOOKING_CANCELLED',
        title: 'Refund Processed',
        message: `Your refund of $${refundAmount} has been processed.`,
        data: { bookingId: payment.bookingId },
      }),
      notificationService.createNotification({
        recipientId: payment.booking.maidId,
        recipientType: 'MAID',
        type: 'BOOKING_CANCELLED',
        title: 'Refund Processed',
        message: `A refund of $${refundAmount} has been processed for booking from ${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
        data: { bookingId: payment.bookingId },
      }),
    ]);
  }
} 