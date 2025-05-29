import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';
import { PaymentService } from './payment.service';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();
const paymentService = new PaymentService();
const notificationService = new NotificationService();

export class BookingService {
  async createBooking(bookingData: any) {
    try {
      // Create payment intent first
      const paymentIntent = await paymentService.createPaymentIntent(bookingData.total);

      // Create booking with payment status
      const booking = await prisma.booking.create({
        data: {
          ...bookingData,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: {
          user: true,
          maid: true,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          stripePaymentId: paymentIntent.paymentIntentId,
          amount: bookingData.total,
          status: PaymentStatus.PENDING,
        },
      });

      // Send notification to maid
      await notificationService.createNotification({
        recipientId: booking.maidId,
        recipientType: 'MAID',
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        message: `You have a new booking request from ${booking.user.firstName} ${booking.user.lastName}`,
        data: { bookingId: booking.id },
      });

      return {
        booking,
        paymentIntent: {
          clientSecret: paymentIntent.clientSecret,
          paymentIntentId: paymentIntent.paymentIntentId,
        },
      };
    } catch (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  async confirmPayment(bookingId: string, paymentIntentId: string) {
    try {
      // Confirm payment with Stripe
      const paymentIntent = await paymentService.confirmPayment(paymentIntentId);

      // Update payment status
      await prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.SUCCEEDED,
        },
      });

      // Update booking payment status
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.SUCCEEDED,
        },
        include: {
          user: true,
          maid: true,
        },
      });

      // Send notification to user
      await notificationService.createNotification({
        recipientId: booking.userId,
        recipientType: 'USER',
        type: 'BOOKING_ACCEPTED',
        title: 'Payment Confirmed',
        message: 'Your payment has been confirmed and the booking is now active.',
        data: { bookingId: booking.id },
      });

      return booking;
    } catch (error) {
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  async cancelBooking(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          payment: true,
          user: true,
          maid: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Process refund if payment was made
      if (booking.payment && booking.payment.status === PaymentStatus.SUCCEEDED) {
        await paymentService.refundPayment(booking.payment.stripePaymentId);
        
        await prisma.payment.update({
          where: { bookingId },
          data: {
            status: PaymentStatus.REFUNDED,
            refunded: true,
            refundAmount: booking.total,
          },
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          user: true,
          maid: true,
        },
      });

      // Send notifications
      await Promise.all([
        notificationService.createNotification({
          recipientId: booking.userId,
          recipientType: 'USER',
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: 'Your booking has been cancelled and refunded.',
          data: { bookingId: booking.id },
        }),
        notificationService.createNotification({
          recipientId: booking.maidId,
          recipientType: 'MAID',
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: `Booking from ${booking.user.firstName} ${booking.user.lastName} has been cancelled.`,
          data: { bookingId: booking.id },
        }),
      ]);

      return updatedBooking;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  }
} 