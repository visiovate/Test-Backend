import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Get saved maids
export const getSavedMaids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const savedMaids = await prisma.savedMaid.findMany({
      where: { userId },
      include: {
        maid: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            hourlyRate: true,
            services: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        savedMaids: savedMaids.map(saved => saved.maid),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Save maid
export const saveMaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { maidId } = req.params;

    // Check if maid exists
    const maid = await prisma.maid.findUnique({
      where: { id: maidId },
    });

    if (!maid) {
      throw new AppError(404, 'Maid not found');
    }

    // Check if already saved
    const existingSaved = await prisma.savedMaid.findUnique({
      where: {
        userId_maidId: {
          userId,
          maidId,
        },
      },
    });

    if (existingSaved) {
      throw new AppError(409, 'Maid already saved');
    }

    // Save maid
    const savedMaid = await prisma.savedMaid.create({
      data: {
        userId,
        maidId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        savedMaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove saved maid
export const removeSavedMaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { maidId } = req.params;

    // Check if saved
    const savedMaid = await prisma.savedMaid.findUnique({
      where: {
        userId_maidId: {
          userId,
          maidId,
        },
      },
    });

    if (!savedMaid) {
      throw new AppError(404, 'Maid not saved');
    }

    // Remove saved maid
    await prisma.savedMaid.delete({
      where: {
        userId_maidId: {
          userId,
          maidId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Maid removed from saved list',
    });
  } catch (error) {
    next(error);
  }
};

// Get bookings
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
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

// Get booking details
export const getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
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

    if (booking.userId !== userId) {
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

    if (booking.userId !== userId) {
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

// Get reviews
export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          maid: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          booking: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledTime: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
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

// Leave review
export const leaveReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        review: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.userId !== userId) {
      throw new AppError(403, 'Not authorized to review this booking');
    }

    if (booking.status !== 'COMPLETED') {
      throw new AppError(400, 'Cannot review booking that is not completed');
    }

    if (booking.review) {
      throw new AppError(409, 'Review already exists for this booking');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        maidId: booking.maidId,
        bookingId: booking.id,
        rating,
        comment,
      },
    });

    // Update maid's rating
    const maidReviews = await prisma.review.findMany({
      where: { maidId: booking.maidId },
    });

    const ratingAvg = maidReviews.reduce((acc, curr) => acc + curr.rating, 0) / maidReviews.length;

    await prisma.maid.update({
      where: { id: booking.maidId },
      data: {
        ratingAvg,
        ratingCount: maidReviews.length,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
}; 