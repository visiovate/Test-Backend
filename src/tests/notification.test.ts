import { PrismaClient, NotificationType } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();

describe('NotificationService', () => {
  let userId: string;
  let maidId: string;

  beforeAll(async () => {
    // Create test user and maid
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        isVerified: true,
      },
    });

    const maid = await prisma.maid.create({
      data: {
        email: 'testmaid@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Maid',
        phone: '+1987654321',
        hourlyRate: 25.00,
        services: ['House Cleaning'],
        languages: ['English'],
        serviceAreas: ['Test Area'],
        isVerified: true,
      },
    });

    userId = user.id;
    maidId = maid.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: userId },
          { recipientId: maidId },
        ],
      },
    });

    await prisma.user.delete({ where: { id: userId } });
    await prisma.maid.delete({ where: { id: maidId } });

    await prisma.$disconnect();
  });

  it('should create a notification', async () => {
    const notification = await NotificationService.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'TEST_NOTIFICATION' as NotificationType,
      title: 'Test Notification',
      message: 'This is a test notification',
      data: { test: true },
    });

    expect(notification).toBeDefined();
    expect(notification.recipientId).toBe(userId);
    expect(notification.type).toBe('TEST_NOTIFICATION');
    expect(notification.title).toBe('Test Notification');
    expect(notification.message).toBe('This is a test notification');
    expect(notification.data).toEqual({ test: true });
  });

  it('should create booking notifications for both user and maid', async () => {
    const booking = {
      id: 'test-booking-id',
      userId,
      maidId,
      status: 'ACCEPTED',
    };

    const notifications = await NotificationService.createBookingNotification(booking, 'ACCEPTED');

    expect(notifications).toHaveLength(2);
    expect(notifications[0].recipientId).toBe(userId);
    expect(notifications[1].recipientId).toBe(maidId);
    expect(notifications[0].type).toBe('BOOKING_ACCEPTED');
    expect(notifications[1].type).toBe('BOOKING_ACCEPTED');
  });

  it('should create a review notification', async () => {
    const review = {
      id: 'test-review-id',
      maidId,
      rating: 5,
    };

    const notification = await NotificationService.createReviewNotification(review);

    expect(notification).toBeDefined();
    expect(notification.recipientId).toBe(maidId);
    expect(notification.type).toBe('NEW_REVIEW');
    expect(notification.data).toEqual({
      reviewId: 'test-review-id',
      rating: 5,
    });
  });

  it('should create a message notification', async () => {
    const message = {
      id: 'test-message-id',
      bookingId: 'test-booking-id',
    };

    const notification = await NotificationService.createMessageNotification(
      message,
      maidId,
      'MAID'
    );

    expect(notification).toBeDefined();
    expect(notification.recipientId).toBe(maidId);
    expect(notification.type).toBe('NEW_MESSAGE');
    expect(notification.data).toEqual({
      messageId: 'test-message-id',
      bookingId: 'test-booking-id',
    });
  });
}); 