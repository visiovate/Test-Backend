import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Get notifications
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;
    const { page = 1, limit = 10, isRead } = req.query;

    const where = {
      recipientId: userId,
      recipientType: userType === 'user' ? 'USER' : 'MAID',
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.recipientId !== userId || notification.recipientType !== (userType === 'user' ? 'USER' : 'MAID')) {
      throw new AppError(403, 'Not authorized to update this notification');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: {
        notification: updatedNotification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        recipientType: userType === 'user' ? 'USER' : 'MAID',
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.recipientId !== userId || notification.recipientType !== (userType === 'user' ? 'USER' : 'MAID')) {
      throw new AppError(403, 'Not authorized to delete this notification');
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;

    await prisma.notification.deleteMany({
      where: {
        recipientId: userId,
        recipientType: userType === 'user' ? 'USER' : 'MAID',
      },
    });

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 