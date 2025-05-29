import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Get maid reviews
export const getMaidReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maidId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if maid exists
    const maid = await prisma.maid.findUnique({
      where: { id: maidId },
    });

    if (!maid) {
      throw new AppError(404, 'Maid not found');
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { maidId },
        include: {
          user: {
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
      prisma.review.count({ where: { maidId } }),
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

// Get user reviews
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
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

// Create review
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    // Check if booking exists and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
          },
        },
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

// Update review
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new AppError(403, 'Not authorized to update this review');
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(comment && { comment }),
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
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
          },
        },
      },
    });

    // Update maid's rating if rating was changed
    if (rating) {
      const maidReviews = await prisma.review.findMany({
        where: { maidId: review.maidId },
      });

      const ratingAvg = maidReviews.reduce((acc, curr) => acc + curr.rating, 0) / maidReviews.length;

      await prisma.maid.update({
        where: { id: review.maidId },
        data: {
          ratingAvg,
          ratingCount: maidReviews.length,
        },
      });
    }

    res.json({
      success: true,
      data: {
        review: updatedReview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new AppError(403, 'Not authorized to delete this review');
    }

    // Delete review
    await prisma.review.delete({
      where: { id },
    });

    // Update maid's rating
    const maidReviews = await prisma.review.findMany({
      where: { maidId: review.maidId },
    });

    const ratingAvg = maidReviews.length > 0
      ? maidReviews.reduce((acc, curr) => acc + curr.rating, 0) / maidReviews.length
      : 0;

    await prisma.maid.update({
      where: { id: review.maidId },
      data: {
        ratingAvg,
        ratingCount: maidReviews.length,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 