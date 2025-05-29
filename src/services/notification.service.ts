import { PrismaClient, NotificationType } from '@prisma/client';
import { io } from '../socket/socket.handler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  static async createNotification(data: {
    recipientId: string;
    recipientType: 'USER' | 'MAID';
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          recipientType: data.recipientType,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
        },
      });

      // Send real-time notification through socket
      io.to(`${data.recipientType.toLowerCase()}:${data.recipientId}`).emit('notification:new', {
        notification,
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createBookingNotification(booking: any, type: string) {
    try {
      const notifications = [];

      // Notify user
      const userNotification = await this.createNotification({
        recipientId: booking.userId,
        recipientType: 'USER',
        type: `BOOKING_${type}` as NotificationType,
        title: `Booking ${type.toLowerCase()}`,
        message: `Your booking has been ${type.toLowerCase()}`,
        data: {
          bookingId: booking.id,
          status: type,
        },
      });
      notifications.push(userNotification);

      // Notify maid
      const maidNotification = await this.createNotification({
        recipientId: booking.maidId,
        recipientType: 'MAID',
        type: `BOOKING_${type}` as NotificationType,
        title: `Booking ${type.toLowerCase()}`,
        message: `A booking has been ${type.toLowerCase()}`,
        data: {
          bookingId: booking.id,
          status: type,
        },
      });
      notifications.push(maidNotification);

      return notifications;
    } catch (error) {
      logger.error('Error creating booking notification:', error);
      throw error;
    }
  }

  static async createReviewNotification(review: any) {
    try {
      return await this.createNotification({
        recipientId: review.maidId,
        recipientType: 'MAID',
        type: 'NEW_REVIEW' as NotificationType,
        title: 'New Review',
        message: 'You have received a new review',
        data: {
          reviewId: review.id,
          rating: review.rating,
        },
      });
    } catch (error) {
      logger.error('Error creating review notification:', error);
      throw error;
    }
  }

  static async createMessageNotification(message: any, recipientId: string, recipientType: 'USER' | 'MAID') {
    try {
      return await this.createNotification({
        recipientId,
        recipientType,
        type: 'NEW_MESSAGE' as NotificationType,
        title: 'New Message',
        message: 'You have received a new message',
        data: {
          messageId: message.id,
          bookingId: message.bookingId,
        },
      });
    } catch (error) {
      logger.error('Error creating message notification:', error);
      throw error;
    }
  }
} 