import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { io } from '../socket/socket.handler';

const prisma = new PrismaClient();

// Create booking
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      maidId,
      scheduledDate,
      scheduledTime,
      duration,
      services,
      address,
      city,
      state,
      zipCode,
      notes,
    } = req.body;

    // Check if maid exists and is available
    const maid = await prisma.maid.findUnique({
      where: { id: maidId },
      select: {
        id: true,
        hourlyRate: true,
        availability: true,
      },
    });

    if (!maid) {
      throw new AppError(404, 'Maid not found');
    }

    // Check if maid is available at the requested time
    const bookingDate = new Date(scheduledDate);
    const dayOfWeek = bookingDate.toLocaleUpperCase().split(',')[0];
    const maidAvailability = maid.availability.find(a => a.day === dayOfWeek);

    if (!maidAvailability) {
      throw new AppError(400, 'Maid is not available on this day');
    }

    const [bookingHour] = scheduledTime.split(':');
    const bookingTime = parseInt(bookingHour);
    const [startHour] = maidAvailability.startTime.split(':');
    const [endHour] = maidAvailability.endTime.split(':');
    const startTime = parseInt(startHour);
    const endTime = parseInt(endHour);

    if (bookingTime < startTime || bookingTime + duration > endTime) {
      throw new AppError(400, 'Booking time is outside maid\'s availability');
    }

    // Check for existing bookings at the same time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        maidId,
        scheduledDate,
        scheduledTime,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
    });

    if (existingBooking) {
      throw new AppError(409, 'Maid already has a booking at this time');
    }

    // Calculate total amount
    const totalAmount = maid.hourlyRate * duration;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        maidId,
        scheduledDate,
        scheduledTime,
        duration,
        services,
        address,
        city,
        state,
        zipCode,
        notes,
        totalAmount,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        maid: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify maid through socket
    io.to(`maid:${maidId}`).emit('booking:request', {
      booking,
    });

    res.status(201).json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get booking details
export const getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            phone: true,
          },
        },
        maid: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            phone: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.userId !== userId && booking.maidId !== userId) {
      throw new AppError(403, 'Not authorized to view this booking');
    }

    res.json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.userId !== userId && booking.maidId !== userId) {
      throw new AppError(403, 'Not authorized to cancel this booking');
    }

    if (booking.status !== 'PENDING' && booking.status !== 'ACCEPTED') {
      throw new AppError(400, 'Cannot cancel booking in current status');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: reason,
      },
    });

    // Notify both user and maid through socket
    io.to(`user:${booking.userId}`).emit('booking:status', {
      booking: updatedBooking,
    });
    io.to(`maid:${booking.maidId}`).emit('booking:status', {
      booking: updatedBooking,
    });

    res.json({
      success: true,
      data: {
        booking: updatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get chat messages
export const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.userId !== userId && booking.maidId !== userId) {
      throw new AppError(403, 'Not authorized to view these messages');
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { bookingId: id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.message.count({ where: { bookingId: id } }),
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
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

// Send chat message
export const sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { message } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.userId !== userId && booking.maidId !== userId) {
      throw new AppError(403, 'Not authorized to send messages for this booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError(400, 'Cannot send messages for cancelled booking');
    }

    const newMessage = await prisma.message.create({
      data: {
        bookingId: id,
        senderId: userId,
        content: message,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify both user and maid through socket
    io.to(`booking:${id}`).emit('chat:message', {
      message: newMessage,
    });

    res.status(201).json({
      success: true,
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get booking history
export const getBookingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      OR: [
        { userId },
        { maidId: userId },
      ],
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          maid: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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